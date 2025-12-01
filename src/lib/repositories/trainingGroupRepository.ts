import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const trainingGroupRepository = {
  /**
   * Find training group by ID
   */
  async findById(id: string, include?: Prisma.TrainingGroupInclude) {
    return prisma.trainingGroup.findUnique({
      where: { id },
      include,
    });
  },

  /**
   * Find training group with all details
   */
  async findWithDetails(id: string) {
    return prisma.trainingGroup.findUnique({
      where: { id },
      include: {
        recurringTraining: true,
        athleteAssignments: {
          include: { athlete: { include: { user: true } } },
        },
        trainerAssignments: {
          include: { trainer: { include: { user: true } } },
        },
      },
    });
  },

  /**
   * Find all groups for a recurring training
   */
  async findByRecurringTraining(recurringTrainingId: string) {
    return prisma.trainingGroup.findMany({
      where: { recurringTrainingId },
      include: {
        athleteAssignments: {
          include: { athlete: { include: { user: true } } },
        },
        trainerAssignments: {
          include: { trainer: { include: { user: true } } },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  },

  /**
   * Create a training group
   */
  async create(data: {
    recurringTrainingId: string;
    name: string;
    sortOrder?: number;
  }) {
    return prisma.trainingGroup.create({
      data: {
        recurringTrainingId: data.recurringTrainingId,
        name: data.name,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  },

  /**
   * Update training group
   */
  async update(id: string, data: Prisma.TrainingGroupUpdateInput) {
    return prisma.trainingGroup.update({
      where: { id },
      data,
    });
  },

  /**
   * Delete training group
   */
  async delete(id: string) {
    return prisma.trainingGroup.delete({
      where: { id },
    });
  },

  /**
   * Assign athlete to training group
   */
  async assignAthlete(data: {
    trainingGroupId: string;
    athleteId: string;
    assignedByTrainerId: string;
  }) {
    return prisma.recurringTrainingAthleteAssignment.create({
      data: {
        trainingGroupId: data.trainingGroupId,
        athleteId: data.athleteId,
        assignedBy: data.assignedByTrainerId,
      },
    });
  },

  /**
   * Remove athlete from training group
   */
  async removeAthlete(trainingGroupId: string, athleteId: string) {
    return prisma.recurringTrainingAthleteAssignment.delete({
      where: {
        trainingGroupId_athleteId: {
          trainingGroupId,
          athleteId,
        },
      },
    });
  },

  /**
   * Assign trainer to training group
   */
  async assignTrainer(data: {
    trainingGroupId: string;
    trainerId: string;
    assignedByTrainerId: string;
    isPrimary?: boolean;
  }) {
    return prisma.recurringTrainingTrainerAssignment.create({
      data: {
        trainingGroupId: data.trainingGroupId,
        trainerId: data.trainerId,
        assignedBy: data.assignedByTrainerId,
        isPrimary: data.isPrimary ?? false,
      },
    });
  },

  /**
   * Remove trainer from training group
   */
  async removeTrainer(trainingGroupId: string, trainerId: string) {
    return prisma.recurringTrainingTrainerAssignment.delete({
      where: {
        trainingGroupId_trainerId: {
          trainingGroupId,
          trainerId,
        },
      },
    });
  },

  /**
   * Update trainer assignment (e.g., set as primary)
   */
  async updateTrainerAssignment(
    trainingGroupId: string,
    trainerId: string,
    data: { isPrimary?: boolean }
  ) {
    return prisma.recurringTrainingTrainerAssignment.update({
      where: {
        trainingGroupId_trainerId: {
          trainingGroupId,
          trainerId,
        },
      },
      data,
    });
  },
};
