import { recurringTrainingRepository } from '@/lib/repositories';
import { prisma } from '@/lib/prisma';
import { DayOfWeek, RecurrenceInterval } from '@prisma/client';

export const trainingService = {
  /**
   * Create a new recurring training with initial group
   */
  async createRecurringTraining(
    data: {
      name: string;
      dayOfWeek: DayOfWeek;
      startTime: string;
      endTime: string;
      recurrence?: RecurrenceInterval;
      validFrom?: Date;
      validUntil?: Date;
      groupName?: string;
    },
    createdByTrainerId: string
  ) {
    return prisma.$transaction(async (tx) => {
      // Create recurring training
      const training = await tx.recurringTraining.create({
        data: {
          name: data.name,
          dayOfWeek: data.dayOfWeek,
          startTime: data.startTime,
          endTime: data.endTime,
          recurrence: data.recurrence ?? RecurrenceInterval.WEEKLY,
          validFrom: data.validFrom,
          validUntil: data.validUntil,
          createdBy: createdByTrainerId,
        },
      });

      // Create default group if name provided
      if (data.groupName) {
        await tx.trainingGroup.create({
          data: {
            recurringTrainingId: training.id,
            name: data.groupName,
            sortOrder: 0,
          },
        });
      }

      return tx.recurringTraining.findUnique({
        where: { id: training.id },
        include: { trainingGroups: true },
      });
    });
  },

  /**
   * Add a training group to a recurring training
   */
  async addTrainingGroup(recurringTrainingId: string, name: string) {
    // Get current max sort order
    const existingGroups = await prisma.trainingGroup.findMany({
      where: { recurringTrainingId },
      orderBy: { sortOrder: 'desc' },
      take: 1,
    });

    const nextSortOrder = existingGroups.length > 0 ? existingGroups[0].sortOrder + 1 : 0;

    return prisma.trainingGroup.create({
      data: {
        recurringTrainingId,
        name,
        sortOrder: nextSortOrder,
      },
    });
  },

  /**
   * Get all recurring trainings with their groups
   */
  async getAllTrainings(activeOnly = true) {
    return recurringTrainingRepository.findMany({
      activeOnly,
      include: {
        trainingGroups: {
          include: {
            athleteAssignments: {
              include: { athlete: { include: { user: true } } },
            },
            trainerAssignments: {
              include: { trainer: { include: { user: true } } },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
        createdByTrainer: { include: { user: true } },
      },
    });
  },

  /**
   * Get trainings by day of week
   */
  async getTrainingsByDay(dayOfWeek: DayOfWeek) {
    return recurringTrainingRepository.findByDay(dayOfWeek);
  },

  /**
   * Get weekly schedule (all trainings grouped by day)
   */
  async getWeeklySchedule() {
    const trainings = await this.getAllTrainings();

    const schedule: Record<DayOfWeek, typeof trainings> = {
      MONDAY: [],
      TUESDAY: [],
      WEDNESDAY: [],
      THURSDAY: [],
      FRIDAY: [],
      SATURDAY: [],
      SUNDAY: [],
    };

    for (const training of trainings) {
      schedule[training.dayOfWeek].push(training);
    }

    // Sort each day's trainings by start time
    for (const day of Object.keys(schedule) as DayOfWeek[]) {
      schedule[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
    }

    return schedule;
  },

  /**
   * Assign athlete to a training group
   */
  async assignAthleteToGroup(
    trainingGroupId: string,
    athleteId: string,
    assignedByTrainerId: string
  ) {
    // Check if already assigned
    const existing = await prisma.recurringTrainingAthleteAssignment.findUnique({
      where: {
        trainingGroupId_athleteId: { trainingGroupId, athleteId },
      },
    });

    if (existing) {
      throw new Error('Athlet ist bereits dieser Gruppe zugeordnet');
    }

    return prisma.recurringTrainingAthleteAssignment.create({
      data: {
        trainingGroupId,
        athleteId,
        assignedBy: assignedByTrainerId,
      },
    });
  },

  /**
   * Remove athlete from a training group
   */
  async removeAthleteFromGroup(trainingGroupId: string, athleteId: string) {
    return prisma.recurringTrainingAthleteAssignment.delete({
      where: {
        trainingGroupId_athleteId: { trainingGroupId, athleteId },
      },
    });
  },

  /**
   * Assign trainer to a training group
   */
  async assignTrainerToGroup(
    trainingGroupId: string,
    trainerId: string,
    assignedByTrainerId: string,
    isPrimary = false
  ) {
    // Check if already assigned
    const existing = await prisma.recurringTrainingTrainerAssignment.findUnique({
      where: {
        trainingGroupId_trainerId: { trainingGroupId, trainerId },
      },
    });

    if (existing) {
      throw new Error('Trainer ist bereits dieser Gruppe zugeordnet');
    }

    return prisma.recurringTrainingTrainerAssignment.create({
      data: {
        trainingGroupId,
        trainerId,
        assignedBy: assignedByTrainerId,
        isPrimary,
      },
    });
  },

  /**
   * Remove trainer from a training group
   */
  async removeTrainerFromGroup(trainingGroupId: string, trainerId: string) {
    return prisma.recurringTrainingTrainerAssignment.delete({
      where: {
        trainingGroupId_trainerId: { trainingGroupId, trainerId },
      },
    });
  },

  /**
   * Update training group
   */
  async updateTrainingGroup(groupId: string, data: { name?: string; sortOrder?: number }) {
    return prisma.trainingGroup.update({
      where: { id: groupId },
      data,
    });
  },

  /**
   * Delete training group
   */
  async deleteTrainingGroup(groupId: string) {
    return prisma.trainingGroup.delete({
      where: { id: groupId },
    });
  },

  /**
   * Update recurring training
   */
  async updateRecurringTraining(
    id: string,
    data: {
      name?: string;
      startTime?: string;
      endTime?: string;
      recurrence?: RecurrenceInterval;
      validFrom?: Date | null;
      validUntil?: Date | null;
    }
  ) {
    return recurringTrainingRepository.update(id, data);
  },

  /**
   * Deactivate recurring training
   */
  async deactivateRecurringTraining(id: string) {
    return recurringTrainingRepository.deactivate(id);
  },
};
