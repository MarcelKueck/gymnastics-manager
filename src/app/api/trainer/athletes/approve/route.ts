import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addWeeks, startOfDay, setHours, setMinutes } from 'date-fns';

type DayOfWeek = 'MONDAY' | 'THURSDAY' | 'FRIDAY';

interface TrainingConfig {
  youthCategory: 'F' | 'E' | 'D';
  trainingDays: {
    MONDAY: boolean;
    THURSDAY: boolean;
    FRIDAY: boolean;
  };
  hours: {
    MONDAY: number[];
    THURSDAY: number[];
    FRIDAY: number[];
  };
  groupNumbers: {
    MONDAY: number;
    THURSDAY: number;
    FRIDAY: number;
  };
  competitionParticipation: boolean;
}

const dayOfWeekMap: Record<string, number> = {
  MONDAY: 1,
  THURSDAY: 4,
  FRIDAY: 5,
};

function getNextOccurrence(targetDay: number): Date {
  const today = new Date();
  const currentDay = today.getDay();
  const daysUntilTarget = (targetDay - currentDay + 7) % 7 || 7;
  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + daysUntilTarget);
  return startOfDay(nextDate);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'TRAINER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { athleteId, config } = body as { athleteId: string; config: TrainingConfig };

    // Validation
    if (!athleteId || !config) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const selectedDays = Object.values(config.trainingDays).filter(Boolean).length;
    if (selectedDays === 0) {
      return NextResponse.json(
        { error: 'At least one training day must be selected' },
        { status: 400 }
      );
    }

    // Check athlete exists and is not already approved
    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
    });

    if (!athlete) {
      return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
    }

    if (athlete.isApproved) {
      return NextResponse.json({ error: 'Athlete already approved' }, { status: 400 });
    }

    const trainerId = session.user.id;
    const now = new Date();

    // Start a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Update athlete - approve and set configuration
      await tx.athlete.update({
        where: { id: athleteId },
        data: {
          isApproved: true,
          approvedBy: trainerId,
          approvedAt: now,
          configuredAt: now,
          youthCategory: config.youthCategory,
          competitionParticipation: config.competitionParticipation,
        },
      });

      // 2. Create group assignments for each selected day/hour combination
      const assignments: any[] = [];

      for (const [day, enabled] of Object.entries(config.trainingDays)) {
        if (enabled) {
          const dayKey = day as DayOfWeek;
          const hours = config.hours[dayKey];
          const groupNumber = config.groupNumbers[dayKey];

          for (const hour of hours) {
            assignments.push({
              athleteId,
              trainingDay: dayKey,
              hourNumber: hour,
              groupNumber,
              assignedBy: trainerId,
              isActive: true,
            });
          }
        }
      }

      if (assignments.length > 0) {
        await tx.athleteGroupAssignment.createMany({
          data: assignments,
        });
      }

      // 3. Generate future training sessions (next 12 weeks)
      const sessions: any[] = [];
      const weeksToGenerate = 12;

      for (const [day, enabled] of Object.entries(config.trainingDays)) {
        if (enabled) {
          const dayKey = day as DayOfWeek;
          const hours = config.hours[dayKey];
          const groupNumber = config.groupNumbers[dayKey];
          const targetDayNumber = dayOfWeekMap[dayKey];

          // Get the next occurrence of this day
          let sessionDate = getNextOccurrence(targetDayNumber);

          for (let week = 0; week < weeksToGenerate; week++) {
            for (const hour of hours) {
              // Set time based on hour (e.g., 1st hour = 16:00, 2nd hour = 17:30)
              const hourTime = hour === 1 ? 16 : 17;
              const minuteTime = hour === 1 ? 0 : 30;
              const sessionDateTime = setMinutes(setHours(sessionDate, hourTime), minuteTime);

              sessions.push({
                date: sessionDateTime,
                dayOfWeek: dayKey,
                hourNumber: hour,
                groupNumber,
              });
            }
            sessionDate = addWeeks(sessionDate, 1);
          }
        }
      }

      // Create sessions (use createMany with skipDuplicates to avoid conflicts)
      if (sessions.length > 0) {
        await tx.trainingSession.createMany({
          data: sessions,
          skipDuplicates: true,
        });
      }

      // 4. Create audit log entry
      await tx.auditLog.create({
        data: {
          entityType: 'athlete',
          entityId: athleteId,
          action: 'create',
          changes: {
            approved: true,
            configuration: config,
            sessionsGenerated: sessions.length,
          },
          performedBy: trainerId,
          reason: 'Athlete approved and configured',
        },
      });
    });

    // TODO: Send email notification to athlete
    // This would be implemented with a service like Resend or SendGrid

    return NextResponse.json({
      success: true,
      message: 'Athlete approved and configured successfully',
    });
  } catch (error) {
    console.error('Approve athlete error:', error);
    return NextResponse.json(
      { error: 'Failed to approve athlete' },
      { status: 500 }
    );
  }
}