import { prisma } from '@/lib/prisma';
import { DayOfWeek, RecurrenceInterval } from '@prisma/client';
import {
  DAY_OF_WEEK_TO_NUMBER,
  getTodayUTC,
  addUTCDays,
  compareUTCDates,
  toUTCMidnight,
  getUTCDayOfWeek,
} from '@/lib/utils/date';

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

    const today = getTodayUTC();
    const endDate = addUTCDays(today, daysAhead);

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
   * Calculate session dates based on recurrence pattern (all UTC dates)
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
    const targetDayNumber = DAY_OF_WEEK_TO_NUMBER[dayOfWeek];

    // Find the first occurrence of the target day on or after startDate (all UTC)
    let currentDate = toUTCMidnight(startDate);
    const currentDayNumber = getUTCDayOfWeek(currentDate);

    // Calculate days until next occurrence of target day
    let daysUntilTarget = targetDayNumber - currentDayNumber;
    if (daysUntilTarget < 0) {
      daysUntilTarget += 7;
    }
    currentDate = addUTCDays(currentDate, daysUntilTarget);

    // Apply validFrom constraint
    if (validFrom) {
      const validFromUTC = toUTCMidnight(validFrom);
      if (compareUTCDates(currentDate, validFromUTC) < 0) {
        currentDate = validFromUTC;
        // Adjust to target day if needed
        const dayDiff = targetDayNumber - getUTCDayOfWeek(currentDate);
        if (dayDiff !== 0) {
          currentDate = addUTCDays(currentDate, dayDiff < 0 ? dayDiff + 7 : dayDiff);
        }
      }
    }

    // Generate dates based on recurrence
    const endDateUTC = toUTCMidnight(endDate);
    while (compareUTCDates(currentDate, endDateUTC) <= 0) {
      // Check validUntil constraint
      if (validUntil && compareUTCDates(currentDate, toUTCMidnight(validUntil)) > 0) {
        break;
      }

      dates.push(new Date(currentDate));

      // Move to next occurrence based on recurrence
      switch (recurrence) {
        case RecurrenceInterval.ONCE:
          // Only one occurrence
          return dates;

        case RecurrenceInterval.WEEKLY:
          currentDate = addUTCDays(currentDate, 7);
          break;

        case RecurrenceInterval.BIWEEKLY:
          currentDate = addUTCDays(currentDate, 14);
          break;

        case RecurrenceInterval.MONTHLY:
          // Add roughly a month then adjust to same day of week
          const newMonth = currentDate.getUTCMonth() + 1;
          const newYear = currentDate.getUTCFullYear() + Math.floor(newMonth / 12);
          const monthDate = new Date(Date.UTC(newYear, newMonth % 12, currentDate.getUTCDate()));
          // Adjust to same day of week in new month
          const newDayNumber = monthDate.getUTCDay();
          const dayAdjust = targetDayNumber - newDayNumber;
          if (dayAdjust !== 0) {
            currentDate = addUTCDays(monthDate, dayAdjust);
          } else {
            currentDate = monthDate;
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

    const today = getTodayUTC();
    const endDate = addUTCDays(today, daysAhead);

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
    const sessionDate = toUTCMidnight(data.date);
    const dayOfWeek = JS_DAY_TO_ENUM[getUTCDayOfWeek(sessionDate)];

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
    const today = getTodayUTC();

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
