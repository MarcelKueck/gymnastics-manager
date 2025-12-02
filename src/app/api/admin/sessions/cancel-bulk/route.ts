import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';
import { sendSessionCancellation } from '@/lib/email';

// POST - Cancel multiple sessions or sessions in a date range
export async function POST(request: NextRequest) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const { recurringTrainingId, startDate, endDate, reason, sendNotification = true } = body;

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: 'Start- und Enddatum sind erforderlich' },
      { status: 400 }
    );
  }

  if (!reason || reason.trim().length < 5) {
    return NextResponse.json(
      { error: 'Grund muss mindestens 5 Zeichen haben' },
      { status: 400 }
    );
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  if (end < start) {
    return NextResponse.json(
      { error: 'Enddatum muss nach Startdatum liegen' },
      { status: 400 }
    );
  }

  // Get admin's trainer profile
  const adminProfile = await prisma.trainerProfile.findFirst({
    where: { userId: session!.user.id },
  });

  if (!adminProfile) {
    return NextResponse.json({ error: 'Admin-Profil nicht gefunden' }, { status: 404 });
  }

  // Get all recurring trainings to cancel
  const recurringTrainingsWhere = recurringTrainingId
    ? { id: recurringTrainingId, isActive: true }
    : { isActive: true };

  const recurringTrainings = await prisma.recurringTraining.findMany({
    where: recurringTrainingsWhere,
    include: {
      trainingGroups: {
        include: {
          athleteAssignments: {
            include: {
              athlete: {
                include: {
                  user: { select: { email: true, firstName: true, lastName: true } },
                },
              },
            },
          },
          trainerAssignments: {
            include: {
              trainer: {
                include: {
                  user: { select: { email: true, firstName: true, lastName: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  // Helper to get day of week from date
  const getDayOfWeek = (date: Date): string => {
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    return days[date.getDay()];
  };

  // Generate all dates between start and end
  const datesToCancel: Date[] = [];
  const currentDate = new Date(start);
  while (currentDate <= end) {
    datesToCancel.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const cancelledSessions: Array<{
    id: string;
    date: Date;
    trainingName: string;
  }> = [];
  const emailRecipients = new Set<string>();
  const affectedTrainings: Array<{
    name: string;
    date: Date;
    startTime: string;
    endTime: string;
  }> = [];

  for (const rt of recurringTrainings) {
    // Find dates that match this recurring training's day of week
    const matchingDates = datesToCancel.filter(
      (d) => getDayOfWeek(d) === rt.dayOfWeek
    );

    for (const date of matchingDates) {
      // Check if session exists
      let existingSession = await prisma.trainingSession.findFirst({
        where: {
          recurringTrainingId: rt.id,
          date: {
            gte: new Date(date.setHours(0, 0, 0, 0)),
            lt: new Date(new Date(date).setHours(23, 59, 59, 999)),
          },
        },
      });

      if (existingSession) {
        // Update existing session
        existingSession = await prisma.trainingSession.update({
          where: { id: existingSession.id },
          data: {
            isCancelled: true,
            cancelledBy: adminProfile.id,
            cancelledAt: new Date(),
            cancellationReason: reason.trim(),
          },
        });
      } else {
        // Create cancelled session
        existingSession = await prisma.trainingSession.create({
          data: {
            recurringTrainingId: rt.id,
            date: new Date(date.setHours(12, 0, 0, 0)), // Noon to avoid timezone issues
            dayOfWeek: rt.dayOfWeek as 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY',
            startTime: rt.startTime,
            endTime: rt.endTime,
            isCancelled: true,
            cancelledBy: adminProfile.id,
            cancelledAt: new Date(),
            cancellationReason: reason.trim(),
          },
        });
      }

      cancelledSessions.push({
        id: existingSession.id,
        date: new Date(date),
        trainingName: rt.name,
      });

      affectedTrainings.push({
        name: rt.name,
        date: new Date(date),
        startTime: rt.startTime,
        endTime: rt.endTime,
      });

      // Collect email recipients
      for (const group of rt.trainingGroups) {
        for (const assignment of group.athleteAssignments) {
          if (assignment.athlete.user.email) {
            emailRecipients.add(assignment.athlete.user.email);
          }
        }
        for (const assignment of group.trainerAssignments) {
          if (assignment.trainer.user.email) {
            emailRecipients.add(assignment.trainer.user.email);
          }
        }
      }
    }
  }

  // Send notification emails if requested
  if (sendNotification && emailRecipients.size > 0 && affectedTrainings.length > 0) {
    try {
      // Group trainings by date for the email
      const trainingsByDate = affectedTrainings.reduce((acc, t) => {
        const dateKey = t.date.toISOString().split('T')[0];
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push(t);
        return acc;
      }, {} as Record<string, typeof affectedTrainings>);

      // Build session info for email
      const sessionInfo = {
        date: affectedTrainings.length === 1
          ? affectedTrainings[0].date.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
          : `${start.toLocaleDateString('de-DE')} - ${end.toLocaleDateString('de-DE')}`,
        time: affectedTrainings.length === 1
          ? `${affectedTrainings[0].startTime} - ${affectedTrainings[0].endTime}`
          : Object.entries(trainingsByDate)
              .map(([date, trainings]) => 
                `${new Date(date).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })}: ${trainings.map(t => `${t.name} (${t.startTime})`).join(', ')}`
              ).join('\n'),
        trainingName: affectedTrainings.length === 1 
          ? affectedTrainings[0].name 
          : `${affectedTrainings.length} Trainingseinheiten`,
      };

      // Send email to all recipients
      await sendSessionCancellation(
        Array.from(emailRecipients),
        sessionInfo,
        reason.trim()
      );
    } catch (emailError) {
      console.error('Error sending cancellation emails:', emailError);
      // Don't fail the request if email fails
    }
  }

  return NextResponse.json({
    success: true,
    message: `${cancelledSessions.length} Trainingseinheit(en) abgesagt`,
    data: {
      cancelledCount: cancelledSessions.length,
      emailsSent: sendNotification ? emailRecipients.size : 0,
      sessions: cancelledSessions.map((s) => ({
        id: s.id,
        date: s.date.toISOString(),
        trainingName: s.trainingName,
      })),
    },
  });
}
