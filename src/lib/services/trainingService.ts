import { trainingRepository } from '@/lib/repositories/trainingRepository';
import { sessionRepository } from '@/lib/repositories/sessionRepository';
import { prisma } from '@/lib/prisma';
import { DayOfWeek, RecurrenceInterval } from '@prisma/client';
import { addDays, addWeeks, addMonths } from 'date-fns';

export class TrainingService {
  /**
   * Create recurring training
   */
  async createRecurringTraining(
    data: {
      name: string;
      dayOfWeek: DayOfWeek;
      startTime: string;
      endTime: string;
      recurrence: RecurrenceInterval;
      isActive?: boolean;
      validFrom?: string | null;
      validUntil?: string | null;
    },
    createdBy: string
  ) {
    return trainingRepository.createRecurring({
      name: data.name,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      recurrence: data.recurrence,
      isActive: data.isActive ?? true,
      ...(data.validFrom && { validFrom: new Date(data.validFrom) }),
      ...(data.validUntil && { validUntil: new Date(data.validUntil) }),
      createdByTrainer: {
        connect: { id: createdBy },
      },
    });
  }

  /**
   * Update recurring training
   */
  async updateRecurringTraining(
    id: string,
    data: {
      name?: string;
      dayOfWeek?: DayOfWeek;
      startTime?: string;
      endTime?: string;
      recurrence?: RecurrenceInterval;
      isActive?: boolean;
      validFrom?: string | null;
      validUntil?: string | null;
    }
  ) {
    const updateData: any = { ...data };
    
    // Convert date strings to Date objects or explicitly set to null
    if ('validFrom' in data) {
      updateData.validFrom = data.validFrom ? new Date(data.validFrom) : null;
    }
    if ('validUntil' in data) {
      updateData.validUntil = data.validUntil ? new Date(data.validUntil) : null;
    }
    
    return trainingRepository.updateRecurring(id, updateData);
  }

  /**
   * Delete a recurring training and all its data
   * This performs a comprehensive cascade deletion in the correct order
   */
  async deleteRecurringTraining(id: string) {
    // Use a transaction to ensure atomic deletion
    return await prisma.$transaction(async (tx) => {
      // Step 1: Get all training sessions associated with this recurring training
      const trainingSessions = await tx.trainingSession.findMany({
        where: { recurringTrainingId: id },
        select: { id: true },
      });

      const sessionIds = trainingSessions.map((session) => session.id);

      if (sessionIds.length > 0) {
        // Step 2: Delete attendance records for these sessions
        await tx.attendanceRecord.deleteMany({
          where: { trainingSessionId: { in: sessionIds } },
        });

        // Step 3: Delete cancellations for these sessions
        await tx.cancellation.deleteMany({
          where: { trainingSessionId: { in: sessionIds } },
        });

        // Step 4: Delete session athlete assignments
        await tx.sessionAthleteAssignment.deleteMany({
          where: { trainingSessionId: { in: sessionIds } },
        });

        // Step 5: Get all session groups for these sessions
        const sessionGroups = await tx.sessionGroup.findMany({
          where: { trainingSessionId: { in: sessionIds } },
          select: { id: true },
        });

        const sessionGroupIds = sessionGroups.map((sg) => sg.id);

        if (sessionGroupIds.length > 0) {
          // Step 6: Delete session group trainer assignments
          await tx.sessionGroupTrainerAssignment.deleteMany({
            where: { sessionGroupId: { in: sessionGroupIds } },
          });

          // Step 7: Delete session groups
          await tx.sessionGroup.deleteMany({
            where: { id: { in: sessionGroupIds } },
          });
        }

        // Step 8: Delete training sessions
        await tx.trainingSession.deleteMany({
          where: { id: { in: sessionIds } },
        });
      }

      // Step 9: Get all training groups for this recurring training
      const trainingGroups = await tx.trainingGroup.findMany({
        where: { recurringTrainingId: id },
        select: { id: true },
      });

      const groupIds = trainingGroups.map((g) => g.id);

      if (groupIds.length > 0) {
        // Step 10: Delete recurring training athlete assignments
        await tx.recurringTrainingAthleteAssignment.deleteMany({
          where: { trainingGroupId: { in: groupIds } },
        });

        // Step 11: Delete recurring training trainer assignments
        await tx.recurringTrainingTrainerAssignment.deleteMany({
          where: { trainingGroupId: { in: groupIds } },
        });

        // Step 12: Delete training groups
        await tx.trainingGroup.deleteMany({
          where: { id: { in: groupIds } },
        });
      }

      // Step 13: Finally, delete the recurring training itself
      return await tx.recurringTraining.delete({
        where: { id },
      });
    });
  }

  /**
   * Get all recurring trainings
   */
  async getAllRecurringTrainings(activeOnly: boolean = true) {
    return trainingRepository.findAllRecurring(activeOnly);
  }

  /**
   * Create training group
   */
  async createTrainingGroup(
    recurringTrainingId: string,
    name: string,
    sortOrder?: number
  ) {
    return trainingRepository.createGroup({
      recurringTraining: {
        connect: { id: recurringTrainingId },
      },
      name,
      sortOrder: sortOrder ?? 0,
    });
  }

  /**
   * Update training group
   */
  async updateTrainingGroup(id: string, data: { name?: string; sortOrder?: number }) {
    return trainingRepository.updateGroup(id, data);
  }

  /**
   * Delete training group
   */
  async deleteTrainingGroup(id: string) {
    // Check if there are athletes assigned
    const athleteCount = await prisma.recurringTrainingAthleteAssignment.count({
      where: { trainingGroupId: id },
    });

    if (athleteCount > 0) {
      throw new Error(
        'Kann nicht gelöscht werden: Es sind Athleten dieser Gruppe zugewiesen'
      );
    }

    return trainingRepository.deleteGroup(id);
  }

  /**
   * Assign athletes to training group
   */
  async assignAthletesToGroup(
    trainingGroupId: string,
    athleteIds: string[],
    assignedBy: string
  ) {
    return Promise.all(
      athleteIds.map((athleteId) =>
        trainingRepository.assignAthlete(trainingGroupId, athleteId, assignedBy)
      )
    );
  }

  /**
   * Remove athlete from training group
   */
  async removeAthleteFromGroup(trainingGroupId: string, athleteId: string) {
    return trainingRepository.unassignAthlete(trainingGroupId, athleteId);
  }

  /**
   * Assign trainer to training group
   */
  async assignTrainerToGroup(
    trainingGroupId: string,
    trainerId: string,
    assignedBy: string,
    isPrimary: boolean = true
  ) {
    return trainingRepository.assignTrainer(trainingGroupId, trainerId, assignedBy, isPrimary);
  }

  /**
   * Remove trainer from training group
   */
  async removeTrainerFromGroup(trainingGroupId: string, trainerId: string) {
    return trainingRepository.unassignTrainer(trainingGroupId, trainerId);
  }

  /**
   * Generate sessions for recurring trainings
   * This should be run periodically (e.g., weekly) to generate upcoming sessions
   */
  async generateSessions(daysAhead: number = 90) {
    const recurringTrainings = await trainingRepository.findAllRecurring(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sessionsCreated = [];

    for (const training of recurringTrainings) {
      // Calculate next occurrence dates based on recurrence
      const dates = this.calculateOccurrences(
        training.dayOfWeek,
        training.recurrence,
        training.validFrom,
        training.validUntil,
        today,
        daysAhead
      );

      for (const date of dates) {
        // Check if session already exists
        const exists = await sessionRepository.exists(date, training.id);
        if (exists) continue;

        // Create session
        const session = await sessionRepository.create({
          date,
          dayOfWeek: training.dayOfWeek,
          startTime: training.startTime,
          endTime: training.endTime,
          recurringTraining: {
            connect: { id: training.id },
          },
        });

        // Create session groups for each training group
        for (const group of training.groups) {
          const sessionGroup = await sessionRepository.getOrCreateSessionGroup(
            session.id,
            group.id
          );

          // Assign trainers to session group
          for (const trainerAssignment of group.trainerAssignments) {
            await sessionRepository.assignTrainerToSessionGroup(
              sessionGroup.id,
              trainerAssignment.trainerId
            );
          }
        }

        sessionsCreated.push(session);
      }
    }

    return sessionsCreated;
  }

  /**
   * Calculate occurrence dates for recurring training
   */
  private calculateOccurrences(
    dayOfWeek: DayOfWeek,
    recurrence: RecurrenceInterval,
    validFrom: Date | null,
    validUntil: Date | null,
    referenceDate: Date,
    daysAhead: number
  ): Date[] {
    const dates: Date[] = [];
    
    // For ONCE recurrence, return only the validFrom date if it's set
    if (recurrence === RecurrenceInterval.ONCE) {
      if (validFrom) {
        const onceDate = new Date(validFrom);
        onceDate.setHours(0, 0, 0, 0);
        // Only include if it's within our generation window
        const maxDate = addDays(referenceDate, daysAhead);
        if (onceDate >= referenceDate && onceDate <= maxDate) {
          dates.push(onceDate);
        }
      }
      return dates;
    }

    // For recurring trainings
    const endDate = addDays(referenceDate, daysAhead);

    // Map day of week to number (0 = Sunday, 1 = Monday, etc.)
    const dayMap: Record<DayOfWeek, number> = {
      SUNDAY: 0,
      MONDAY: 1,
      TUESDAY: 2,
      WEDNESDAY: 3,
      THURSDAY: 4,
      FRIDAY: 5,
      SATURDAY: 6,
    };

    const targetDay = dayMap[dayOfWeek];
    
    // Determine the starting point
    let currentDate = new Date(referenceDate);
    
    // If validFrom is set and it's after referenceDate, start from validFrom
    if (validFrom) {
      const validFromDate = new Date(validFrom);
      validFromDate.setHours(0, 0, 0, 0);
      if (validFromDate > referenceDate) {
        currentDate = new Date(validFromDate);
      }
    }

    // Find first occurrence on the target day of week
    while (currentDate.getDay() !== targetDay) {
      currentDate = addDays(currentDate, 1);
    }

    // Determine the ending point
    let finalEndDate = endDate;
    if (validUntil) {
      const validUntilDate = new Date(validUntil);
      validUntilDate.setHours(23, 59, 59, 999); // End of day
      if (validUntilDate < finalEndDate) {
        finalEndDate = validUntilDate;
      }
    }

    // Generate occurrences based on recurrence interval
    while (currentDate <= finalEndDate) {
      // Only add if within valid date range
      const shouldAdd = (!validFrom || currentDate >= validFrom) &&
                       (!validUntil || currentDate <= validUntil);
      
      if (shouldAdd) {
        dates.push(new Date(currentDate));
      }

      switch (recurrence) {
        case RecurrenceInterval.WEEKLY:
          currentDate = addWeeks(currentDate, 1);
          break;
        case RecurrenceInterval.BIWEEKLY:
          currentDate = addWeeks(currentDate, 2);
          break;
        case RecurrenceInterval.MONTHLY:
          currentDate = addMonths(currentDate, 1);
          // Adjust to same day of week
          while (currentDate.getDay() !== targetDay) {
            currentDate = addDays(currentDate, 1);
          }
          break;
        default:
          // Should not happen, but break to avoid infinite loop
          break;
      }
    }

    return dates;
  }

  /**
   * Get training group details
   */
  async getGroupDetails(groupId: string) {
    return trainingRepository.findGroupById(groupId);
  }

  /**
   * Get all groups for a recurring training
   */
  async getGroupsForTraining(recurringTrainingId: string) {
    return trainingRepository.findGroupsByRecurringTraining(recurringTrainingId);
  }
}

export const trainingService = new TrainingService();