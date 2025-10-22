import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addWeeks, addDays, startOfDay } from 'date-fns';

// POST generate training sessions from recurring template
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { weeksAhead = 12 } = body; // Default: generate 12 weeks ahead

    const recurringTraining = await prisma.recurringTraining.findUnique({
      where: { id },
      include: {
        groups: {
          include: {
            trainerAssignments: true,
          },
        },
      },
    });

    if (!recurringTraining || !recurringTraining.isActive) {
      return NextResponse.json(
        { error: 'Recurring training not found or inactive' },
        { status: 404 }
      );
    }

    const dayOfWeekMap: Record<string, number> = {
      MONDAY: 1,
      TUESDAY: 2,
      WEDNESDAY: 3,
      THURSDAY: 4,
      FRIDAY: 5,
      SATURDAY: 6,
      SUNDAY: 0,
    };

    const targetDayOfWeek = dayOfWeekMap[recurringTraining.dayOfWeek];
    const startDate = startOfDay(recurringTraining.startDate);
    const endDate = recurringTraining.endDate
      ? startOfDay(recurringTraining.endDate)
      : addWeeks(new Date(), weeksAhead);

    const sessionsToCreate = [];
    let currentDate = startDate;

    // Find the first occurrence of the target day of week
    while (currentDate.getDay() !== targetDayOfWeek) {
      currentDate = addDays(currentDate, 1);
    }

    // Generate sessions based on recurrence interval
    while (currentDate <= endDate) {
      // Check if session already exists
      const existingSession = await prisma.trainingSession.findFirst({
        where: {
          date: currentDate,
          recurringTrainingId: id,
        },
      });

      if (!existingSession) {
        sessionsToCreate.push({
          date: new Date(currentDate),
          dayOfWeek: recurringTraining.dayOfWeek,
          startTime: recurringTraining.startTime,
          endTime: recurringTraining.endTime,
          recurringTrainingId: id,
        });
      }

      // Move to next occurrence based on recurrence interval
      if (recurringTraining.recurrenceInterval === 'WEEKLY') {
        currentDate = addWeeks(currentDate, 1);
      } else if (recurringTraining.recurrenceInterval === 'BIWEEKLY') {
        currentDate = addWeeks(currentDate, 2);
      } else {
        // MONTHLY
        currentDate = addWeeks(currentDate, 4);
      }
    }

    // Create all sessions with their session groups
    const createdSessions = await Promise.all(
      sessionsToCreate.map(async (sessionData) => {
        const session = await prisma.trainingSession.create({
          data: sessionData,
        });

        // Create a SessionGroup for each TrainingGroup
        for (const trainingGroup of recurringTraining.groups) {
          const sessionGroup = await prisma.sessionGroup.create({
            data: {
              trainingSessionId: session.id,
              trainingGroupId: trainingGroup.id,
            },
          });

          // Copy trainer assignments from RecurringTrainingTrainerAssignment to SessionGroupTrainerAssignment
          if (trainingGroup.trainerAssignments.length > 0) {
            await Promise.all(
              trainingGroup.trainerAssignments.map((assignment) =>
                prisma.sessionGroupTrainerAssignment.create({
                  data: {
                    sessionGroupId: sessionGroup.id,
                    trainerId: assignment.trainerId,
                  },
                })
              )
            );
          }
        }

        return session;
      })
    );

    return NextResponse.json({
      message: `Generated ${createdSessions.length} training sessions`,
      sessionsCreated: createdSessions.length,
    });
  } catch (error) {
    console.error('Error generating sessions:', error);
    return NextResponse.json(
      { error: 'Failed to generate sessions' },
      { status: 500 }
    );
  }
}
