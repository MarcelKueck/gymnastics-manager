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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'TRAINER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { config } = body as { config: TrainingConfig };
    const athleteId = params.id;

    // Validation
    if (!config) {
      return NextResponse.json({ error: 'Missing configuration' }, { status: 400 });
    }

    const selectedDays = Object.values(config.trainingDays).filter(Boolean).length;
    if (selectedDays === 0) {
      return NextResponse.json(
        { error: 'At least one training day must be selected' },
        { status: 400 }
      );
    }

    // Check athlete exists
    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId, isApproved: true },
    });

    if (!athlete) {
      return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
    }

    const trainerId = session.user.id;
    const now = new Date();

    // Start a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Update athlete basic config
      await tx.athlete.update({
        where: { id: athleteId },
        data: {
          youthCategory: config.youthCategory,
          competitionParticipation: config.competitionParticipation,
          configuredAt: now,
        },
      });

      // 2. Deactivate all existing assignments
      await tx.athleteGroupAssignment.updateMany({
        where: { athleteId },
        data: { isActive: false },
      });

      // 3. Create new assignments
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

      // 4. Generate future training sessions (next 12 weeks)
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
              // Set time based on hour
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

      // Create sessions (skipDuplicates to avoid conflicts)
      if (sessions.length > 0) {
        await tx.trainingSession.createMany({
          data: sessions,
          skipDuplicates: true,
        });
      }

      // 5. Create audit log entry
      await tx.auditLog.create({
        data: {
          entityType: 'athlete',
          entityId: athleteId,
          action: 'update',
          changes: {
            configurationUpdated: true,
            newConfig: config,
            sessionsGenerated: sessions.length,
          },
          performedBy: trainerId,
          reason: 'Training configuration updated',
        },
      });
    });

    // TODO: Send email notification to athlete about config change

    return NextResponse.json({
      success: true,
      message: 'Configuration updated successfully',
    });
  } catch (error) {
    console.error('Update configuration error:', error);
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    );
  }
}