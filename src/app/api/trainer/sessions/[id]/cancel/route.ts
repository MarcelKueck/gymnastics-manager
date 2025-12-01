import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseVirtualSessionId } from '@/lib/sessions/virtual-sessions';
import { sendSessionCancellation } from '@/lib/email';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    }

    if (session.user.activeRole !== 'TRAINER' && session.user.activeRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { reason } = body;

    // Get trainer profile
    const trainerProfile = await prisma.trainerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!trainerProfile) {
      return NextResponse.json({ error: 'Trainer-Profil nicht gefunden' }, { status: 404 });
    }

    let trainingSession;
    let recurringTraining;

    // Check if this is a virtual session ID
    const virtualInfo = parseVirtualSessionId(id);

    if (virtualInfo) {
      // This is a virtual session - find the recurring training first
      recurringTraining = await prisma.recurringTraining.findUnique({
        where: { id: virtualInfo.recurringTrainingId },
        include: {
          trainingGroups: {
            include: {
              athleteAssignments: {
                include: {
                  athlete: {
                    include: {
                      user: { select: { email: true } },
                    },
                  },
                },
              },
              trainerAssignments: {
                include: {
                  trainer: {
                    include: {
                      user: { select: { email: true } },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!recurringTraining) {
        return NextResponse.json({ error: 'Training nicht gefunden' }, { status: 404 });
      }

      // Check if session already exists for this date
      trainingSession = await prisma.trainingSession.findFirst({
        where: {
          recurringTrainingId: virtualInfo.recurringTrainingId,
          date: virtualInfo.date,
        },
      });

      if (trainingSession) {
        // Update existing session
        trainingSession = await prisma.trainingSession.update({
          where: { id: trainingSession.id },
          data: {
            isCancelled: true,
            cancelledBy: trainerProfile.id,
            cancelledAt: new Date(),
            cancellationReason: reason || null,
          },
        });
      } else {
        // Create new session with cancelled status
        trainingSession = await prisma.trainingSession.create({
          data: {
            date: virtualInfo.date,
            dayOfWeek: recurringTraining.dayOfWeek,
            startTime: recurringTraining.startTime,
            endTime: recurringTraining.endTime,
            recurringTrainingId: virtualInfo.recurringTrainingId,
            isCancelled: true,
            cancelledBy: trainerProfile.id,
            cancelledAt: new Date(),
            cancellationReason: reason || null,
          },
        });
      }
    } else {
      // This is a real session ID
      trainingSession = await prisma.trainingSession.findUnique({
        where: { id },
        include: {
          recurringTraining: {
            include: {
              trainingGroups: {
                include: {
                  athleteAssignments: {
                    include: {
                      athlete: {
                        include: {
                          user: { select: { email: true } },
                        },
                      },
                    },
                  },
                  trainerAssignments: {
                    include: {
                      trainer: {
                        include: {
                          user: { select: { email: true } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!trainingSession) {
        return NextResponse.json({ error: 'Trainingseinheit nicht gefunden' }, { status: 404 });
      }

      recurringTraining = trainingSession.recurringTraining;

      // Update the session
      trainingSession = await prisma.trainingSession.update({
        where: { id },
        data: {
          isCancelled: true,
          cancelledBy: trainerProfile.id,
          cancelledAt: new Date(),
          cancellationReason: reason || null,
        },
      });
    }

    // Collect all emails to notify (athletes and trainers)
    const emailsToNotify = new Set<string>();

    if (recurringTraining) {
      for (const group of recurringTraining.trainingGroups) {
        // Add athlete emails
        for (const assignment of group.athleteAssignments) {
          if (assignment.athlete.user.email) {
            emailsToNotify.add(assignment.athlete.user.email);
          }
        }
        // Add trainer emails
        for (const assignment of group.trainerAssignments) {
          if (assignment.trainer.user.email) {
            emailsToNotify.add(assignment.trainer.user.email);
          }
        }
      }
    }

    // Format date and time for email
    const sessionDate = new Date(trainingSession.date);
    const formattedDate = sessionDate.toLocaleDateString('de-DE', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const startTime = trainingSession.startTime || recurringTraining?.startTime || '';
    const endTime = trainingSession.endTime || recurringTraining?.endTime || '';
    const formattedTime = `${startTime} - ${endTime} Uhr`;

    // Send email notification to all athletes and trainers
    if (emailsToNotify.size > 0) {
      await sendSessionCancellation(
        Array.from(emailsToNotify),
        {
          date: formattedDate,
          time: formattedTime,
          trainingName: recurringTraining?.name || 'Training',
        },
        reason
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Training wurde abgesagt',
      notifiedCount: emailsToNotify.size,
    });
  } catch (error) {
    console.error('Session cancel API error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Absagen des Trainings' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    }

    if (session.user.activeRole !== 'TRAINER' && session.user.activeRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 });
    }

    const { id } = await params;

    // Check if this is a virtual session ID
    const virtualInfo = parseVirtualSessionId(id);

    if (virtualInfo) {
      // For virtual sessions, we need to find if there's a stored session to uncancelled
      const existingSession = await prisma.trainingSession.findFirst({
        where: {
          recurringTrainingId: virtualInfo.recurringTrainingId,
          date: virtualInfo.date,
        },
      });

      if (existingSession) {
        await prisma.trainingSession.update({
          where: { id: existingSession.id },
          data: {
            isCancelled: false,
            cancelledBy: null,
            cancelledAt: null,
            cancellationReason: null,
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Absage wurde zurückgenommen',
      });
    }

    // For real session IDs
    await prisma.trainingSession.update({
      where: { id },
      data: {
        isCancelled: false,
        cancelledBy: null,
        cancelledAt: null,
        cancellationReason: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Absage wurde zurückgenommen',
    });
  } catch (error) {
    console.error('Session uncancel API error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Zurücknehmen der Absage' },
      { status: 500 }
    );
  }
}
