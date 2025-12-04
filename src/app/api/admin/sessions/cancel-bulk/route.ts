import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendSessionCancellation } from '@/lib/email';

// POST - Cancel multiple sessions in a date range
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    }

    if (session.user.activeRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Nur Admins können Bulk-Absagen durchführen' }, { status: 403 });
    }

    const trainerProfile = await prisma.trainerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!trainerProfile) {
      return NextResponse.json({ error: 'Trainer-Profil nicht gefunden' }, { status: 404 });
    }

    const body = await request.json();
    const { startDate, endDate, recurringTrainingId, reason } = body;

    if (!startDate || !endDate || !reason) {
      return NextResponse.json(
        { error: 'Start-, Enddatum und Grund sind erforderlich' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Find all sessions in the date range
    const whereClause: {
      date: { gte: Date; lte: Date };
      isCancelled: boolean;
      recurringTrainingId?: string;
    } = {
      date: { gte: start, lte: end },
      isCancelled: false,
    };

    if (recurringTrainingId) {
      whereClause.recurringTrainingId = recurringTrainingId;
    }

    const sessions = await prisma.trainingSession.findMany({
      where: whereClause,
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

    // Cancel all found sessions
    const cancelledIds: string[] = [];
    const emailsToNotify = new Set<string>();

    for (const trainingSession of sessions) {
      await prisma.trainingSession.update({
        where: { id: trainingSession.id },
        data: {
          isCancelled: true,
          cancelledBy: trainerProfile.id,
          cancelledAt: new Date(),
          cancellationReason: reason,
        },
      });
      cancelledIds.push(trainingSession.id);

      // Collect emails
      if (trainingSession.recurringTraining) {
        for (const group of trainingSession.recurringTraining.trainingGroups) {
          for (const assignment of group.athleteAssignments) {
            if (assignment.athlete.user.email) {
              emailsToNotify.add(assignment.athlete.user.email);
            }
          }
          for (const assignment of group.trainerAssignments) {
            if (assignment.trainer.user.email) {
              emailsToNotify.add(assignment.trainer.user.email);
            }
          }
        }
      }
    }

    // Send email notifications
    if (emailsToNotify.size > 0 && cancelledIds.length > 0) {
      const formattedStartDate = start.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      const formattedEndDate = end.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

      await sendSessionCancellation(
        Array.from(emailsToNotify),
        {
          date: `${formattedStartDate} - ${formattedEndDate}`,
          time: 'Alle Trainings',
          trainingName: recurringTrainingId ? 'Ausgewählte Trainings' : 'Alle Trainings',
        },
        reason
      );
    }

    return NextResponse.json({
      success: true,
      message: `${cancelledIds.length} Trainings wurden abgesagt`,
      cancelledCount: cancelledIds.length,
      notifiedCount: emailsToNotify.size,
    });
  } catch (error) {
    console.error('Bulk cancel sessions error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Absagen der Trainings' },
      { status: 500 }
    );
  }
}
