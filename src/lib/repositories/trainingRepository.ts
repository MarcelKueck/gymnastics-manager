import { prisma } from '@/lib/prisma';
import { Prisma, DayOfWeek } from '@prisma/client';

export class TrainingRepository {
  /**
   * Find recurring training by ID
   */
  async findRecurringById(id: string, include?: Prisma.RecurringTrainingInclude) {
    return prisma.recurringTraining.findUnique({
      where: { id },
      include,
    });
  }

  /**
   * Get all recurring trainings
   */
  async findAllRecurring(activeOnly: boolean = true) {
    return prisma.recurringTraining.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      include: {
        groups: {
          include: {
            athleteAssignments: {
              include: { athlete: true },
            },
            trainerAssignments: {
              include: { trainer: true },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  /**
   * Get recurring trainings by day
   */
  async findRecurringByDay(dayOfWeek: DayOfWeek) {
    return prisma.recurringTraining.findMany({
      where: {
        dayOfWeek,
        isActive: true,
      },
      include: {
        groups: {
          include: {
            athleteAssignments: true,
            trainerAssignments: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  /**
   * Create recurring training
   */
  async createRecurring(data: Prisma.RecurringTrainingCreateInput) {
    return prisma.recurringTraining.create({
      data,
      include: { groups: true },
    });
  }

  /**
   * Update recurring training
   */
  async updateRecurring(id: string, data: Prisma.RecurringTrainingUpdateInput) {
    return prisma.recurringTraining.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete recurring training
   */
  async deleteRecurring(id: string) {
    return prisma.recurringTraining.delete({ where: { id } });
  }

  /**
   * Find training group by ID
   */
  async findGroupById(id: string) {
    return prisma.trainingGroup.findUnique({
      where: { id },
      include: {
        recurringTraining: true,
        athleteAssignments: {
          include: { athlete: true },
        },
        trainerAssignments: {
          include: { trainer: true },
        },
      },
    });
  }

  /**
   * Get all groups for a recurring training
   */
  async findGroupsByRecurringTraining(recurringTrainingId: string) {
    return prisma.trainingGroup.findMany({
      where: { recurringTrainingId },
      include: {
        athleteAssignments: {
          include: { athlete: true },
        },
        trainerAssignments: {
          include: { trainer: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Create training group
   */
  async createGroup(data: Prisma.TrainingGroupCreateInput) {
    return prisma.trainingGroup.create({
      data,
      include: {
        recurringTraining: true,
      },
    });
  }

  /**
   * Update training group
   */
  async updateGroup(id: string, data: Prisma.TrainingGroupUpdateInput) {
    return prisma.trainingGroup.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete training group
   */
  async deleteGroup(id: string) {
    return prisma.trainingGroup.delete({ where: { id } });
  }

  /**
   * Assign athlete to training group
   */
  async assignAthlete(trainingGroupId: string, athleteId: string, assignedBy: string) {
    return prisma.recurringTrainingAthleteAssignment.create({
      data: {
        trainingGroupId,
        athleteId,
        assignedBy,
      },
    });
  }

  /**
   * Remove athlete from training group
   */
  async unassignAthlete(trainingGroupId: string, athleteId: string) {
    return prisma.recurringTrainingAthleteAssignment.deleteMany({
      where: {
        trainingGroupId,
        athleteId,
      },
    });
  }

  /**
   * Assign trainer to training group
   */
  async assignTrainer(
    trainingGroupId: string,
    trainerId: string,
    assignedBy: string,
    isPrimary: boolean = true
  ) {
    return prisma.recurringTrainingTrainerAssignment.create({
      data: {
        trainingGroupId,
        trainerId,
        assignedBy,
        isPrimary,
      },
    });
  }

  /**
   * Remove trainer from training group
   */
  async unassignTrainer(trainingGroupId: string, trainerId: string) {
    return prisma.recurringTrainingTrainerAssignment.deleteMany({
      where: {
        trainingGroupId,
        trainerId,
      },
    });
  }

  /**
   * Get athlete's training groups
   */
  async getAthleteGroups(athleteId: string) {
    return prisma.recurringTrainingAthleteAssignment.findMany({
      where: { athleteId },
      include: {
        trainingGroup: {
          include: {
            recurringTraining: true,
          },
        },
      },
    });
  }

  /**
   * Count active recurring trainings
   */
  async countActiveRecurring() {
    return prisma.recurringTraining.count({
      where: { isActive: true },
    });
  }
}

export const trainingRepository = new TrainingRepository();