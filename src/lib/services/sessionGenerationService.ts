import { prisma } from '@/lib/prisma';
import { DayOfWeek, RecurrenceInterval } from '@prisma/client';
import { addDays, addWeeks, addMonths, startOfDay, isBefore, isAfter } from 'date-fns';

// Map DayOfWeek enum to JavaScript day number (0=Sunday, 1=Monday, etc.)
const DAY_OF_WEEK_MAP: Record<DayOfWeek, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

// Reverse map: JavaScript day number to DayOfWeek enum
const JS_DAY_TO_ENUM: Record<number, DayOfWeek> = {
  0: DayOfWeek.SUNDAY,
  1: DayOfWeek.MONDAY,
  2: DayOfWeek.TUESDAY,
  3: DayOfWeek.WEDNESDAY,
  4: DayOfWeek.THURSDAY,
  5: DayOfWeek.FRIDAY,
  6: DayOfWeek.SATURDAY,
};

export const sessionGenerationService = {
  /**
   * Generate training sessions for all active recurring trainings
   * @param daysAhead Number of days to generate sessions for (default 90)
   */
  async generateSessions(daysAhead = 90): Promise<{
    created: number;
    skipped: number;
    errors: string[];
  }> {
    const results = {
      created: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // Get all active recurring trainings
    const recurringTrainings = await prisma.recurringTraining.findMany({
      where: { isActive: true },
      include: {
        trainingGroups: true,
      },
    });

    const today = startOfDay(new Date());
    const endDate = addDays(today, daysAhead);

    for (const training of recurringTrainings) {
      try {
        const sessionsToCreate = this.calculateSessionDates(
          training.dayOfWeek,
          training.recurrence,
          today,
          endDate,
          training.validFrom ?? undefined,
          training.validUntil ?? undefined
        );

        for (const sessionDate of sessionsToCreate) {
          // Check if session already exists
          const existingSession = await prisma.trainingSession.findFirst({
            where: {
              recurringTrainingId: training.id,
              date: sessionDate,
            },
          });

          if (existingSession) {
            results.skipped++;
            continue;
          }

          // Create the session
          const session = await prisma.trainingSession.create({
            data: {
              date: sessionDate,
              dayOfWeek: training.dayOfWeek,
              recurringTrainingId: training.id,
            },
          });

          // Create session groups for each training group
          for (const group of training.trainingGroups) {
            await prisma.sessionGroup.create({
              data: {
                trainingSessionId: session.id,
                trainingGroupId: group.id,
              },
            });
          }

          // Copy trainer assignments to session groups
          await this.copyTrainerAssignmentsToSession(session.id);

          results.created++;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`Training "${training.name}": ${message}`);
      }
    }

    return results;
  },

  /**
   * Calculate session dates based on recurrence pattern
   */
  calculateSessionDates(
    dayOfWeek: DayOfWeek,
    recurrence: RecurrenceInterval,
    startDate: Date,
    endDate: Date,
    validFrom?: Date,
    validUntil?: Date
  ): Date[] {
    const dates: Date[] = [];
    const targetDayNumber = DAY_OF_WEEK_MAP[dayOfWeek];

    // Find the first occurrence of the target day on or after startDate
    let currentDate = startOfDay(startDate);
    const currentDayNumber = currentDate.getDay();

    // Calculate days until next occurrence of target day
    let daysUntilTarget = targetDayNumber - currentDayNumber;
    if (daysUntilTarget < 0) {
      daysUntilTarget += 7;
    }
    currentDate = addDays(currentDate, daysUntilTarget);

    // Apply validFrom constraint
    if (validFrom && isBefore(currentDate, startOfDay(validFrom))) {
      currentDate = startOfDay(validFrom);
      // Adjust to target day if needed
      const dayDiff = targetDayNumber - currentDate.getDay();
      if (dayDiff !== 0) {
        currentDate = addDays(currentDate, dayDiff < 0 ? dayDiff + 7 : dayDiff);
      }
    }

    // Generate dates based on recurrence
    while (isBefore(currentDate, endDate) || currentDate.getTime() === endDate.getTime()) {
      // Check validUntil constraint
      if (validUntil && isAfter(currentDate, startOfDay(validUntil))) {
        break;
      }

      dates.push(currentDate);

      // Move to next occurrence based on recurrence
      switch (recurrence) {
        case RecurrenceInterval.ONCE:
          // Only one occurrence
          return dates;

        case RecurrenceInterval.WEEKLY:
          currentDate = addWeeks(currentDate, 1);
          break;

        case RecurrenceInterval.BIWEEKLY:
          currentDate = addWeeks(currentDate, 2);
          break;

        case RecurrenceInterval.MONTHLY:
          currentDate = addMonths(currentDate, 1);
          // Adjust to same day of week in new month
          const newDayNumber = currentDate.getDay();
          const dayAdjust = targetDayNumber - newDayNumber;
          if (dayAdjust !== 0) {
            currentDate = addDays(currentDate, dayAdjust);
          }
          break;
      }
    }

    return dates;
  },

  /**
   * Copy trainer assignments from recurring training groups to session groups
   */
  async copyTrainerAssignmentsToSession(sessionId: string) {
    // Get session groups
    const sessionGroups = await prisma.sessionGroup.findMany({
      where: { trainingSessionId: sessionId },
      include: { trainingGroup: true },
    });

    for (const sessionGroup of sessionGroups) {
      // Get trainer assignments for this training group
      const trainerAssignments = await prisma.recurringTrainingTrainerAssignment.findMany({
        where: { trainingGroupId: sessionGroup.trainingGroupId },
      });

      // Create session group trainer assignments
      for (const assignment of trainerAssignments) {
        await prisma.sessionGroupTrainerAssignment.create({
          data: {
            sessionGroupId: sessionGroup.id,
            trainerId: assignment.trainerId,
          },
        });
      }
    }
  },

  /**
   * Generate sessions for a specific recurring training
   */
  async generateSessionsForTraining(
    recurringTrainingId: string,
    daysAhead = 90
  ): Promise<{ created: number; skipped: number }> {
    const training = await prisma.recurringTraining.findUnique({
      where: { id: recurringTrainingId },
      include: { trainingGroups: true },
    });

    if (!training) {
      throw new Error('Recurring training not found');
    }

    const today = startOfDay(new Date());
    const endDate = addDays(today, daysAhead);

    const sessionsToCreate = this.calculateSessionDates(
      training.dayOfWeek,
      training.recurrence,
      today,
      endDate,
      training.validFrom ?? undefined,
      training.validUntil ?? undefined
    );

    let created = 0;
    let skipped = 0;

    for (const sessionDate of sessionsToCreate) {
      const existing = await prisma.trainingSession.findFirst({
        where: {
          recurringTrainingId: training.id,
          date: sessionDate,
        },
      });

      if (existing) {
        skipped++;
        continue;
      }

      const session = await prisma.trainingSession.create({
        data: {
          date: sessionDate,
          dayOfWeek: training.dayOfWeek,
          recurringTrainingId: training.id,
        },
      });

      for (const group of training.trainingGroups) {
        await prisma.sessionGroup.create({
          data: {
            trainingSessionId: session.id,
            trainingGroupId: group.id,
          },
        });
      }

      await this.copyTrainerAssignmentsToSession(session.id);
      created++;
    }

    return { created, skipped };
  },

  /**
   * Create a single ad-hoc session (not from recurring training)
   */
  async createAdHocSession(data: {
    date: Date;
    startTime: string;
    endTime: string;
    notes?: string;
  }) {
    const sessionDate = startOfDay(data.date);
    const dayOfWeek = JS_DAY_TO_ENUM[sessionDate.getDay()];

    return prisma.trainingSession.create({
      data: {
        date: sessionDate,
        dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        notes: data.notes,
      },
    });
  },

  /**
   * Delete future sessions for a recurring training (when deactivating)
   */
  async deleteFutureSessions(recurringTrainingId: string) {
    const today = startOfDay(new Date());

    const deleted = await prisma.trainingSession.deleteMany({
      where: {
        recurringTrainingId,
        date: { gt: today },
        isCompleted: false,
      },
    });

    return deleted.count;
  },
};
