import { prisma } from '@/lib/prisma';
import { Prisma, DayOfWeek, RecurrenceInterval } from '@prisma/client';

export const recurringTrainingRepository = {
  /**
   * Find recurring training by ID
   */
  async findById(id: string, include?: Prisma.RecurringTrainingInclude) {
    return prisma.recurringTraining.findUnique({
      where: { id },
      include,
    });
  },

  /**
   * Find recurring training with all related data
   */
  async findWithDetails(id: string) {
    return prisma.recurringTraining.findUnique({
      where: { id },
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
   * Find all recurring trainings
   */
  async findMany(options?: {
    where?: Prisma.RecurringTrainingWhereInput;
    include?: Prisma.RecurringTrainingInclude;
    orderBy?: Prisma.RecurringTrainingOrderByWithRelationInput;
    activeOnly?: boolean;
  }) {
    const where: Prisma.RecurringTrainingWhereInput = {
      ...options?.where,
      ...(options?.activeOnly !== false && { isActive: true }),
    };

    return prisma.recurringTraining.findMany({
      where,
      include: options?.include ?? {
        trainingGroups: true,
        createdByTrainer: { include: { user: true } },
      },
      orderBy: options?.orderBy ?? [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' },
      ],
    });
  },

  /**
   * Find trainings by day of week
   */
  async findByDay(dayOfWeek: DayOfWeek, activeOnly = true) {
    return prisma.recurringTraining.findMany({
      where: {
        dayOfWeek,
        ...(activeOnly && { isActive: true }),
      },
      include: {
        trainingGroups: {
          include: {
            athleteAssignments: { include: { athlete: { include: { user: true } } } },
            trainerAssignments: { include: { trainer: { include: { user: true } } } },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { startTime: 'asc' },
    });
  },

  /**
   * Create a new recurring training
   */
  async create(data: {
    name: string;
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    recurrence?: RecurrenceInterval;
    createdByTrainerId: string;
    validFrom?: Date;
    validUntil?: Date;
  }) {
    return prisma.recurringTraining.create({
      data: {
        name: data.name,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        recurrence: data.recurrence ?? RecurrenceInterval.WEEKLY,
        createdBy: data.createdByTrainerId,
        validFrom: data.validFrom,
        validUntil: data.validUntil,
      },
      include: {
        trainingGroups: true,
      },
    });
  },

  /**
   * Update recurring training
   */
  async update(id: string, data: Prisma.RecurringTrainingUpdateInput) {
    return prisma.recurringTraining.update({
      where: { id },
      data,
    });
  },

  /**
   * Deactivate recurring training
   */
  async deactivate(id: string) {
    return prisma.recurringTraining.update({
      where: { id },
      data: { isActive: false },
    });
  },

  /**
   * Reactivate recurring training
   */
  async reactivate(id: string) {
    return prisma.recurringTraining.update({
      where: { id },
      data: { isActive: true },
    });
  },

  /**
   * Delete recurring training (use with caution)
   */
  async delete(id: string) {
    return prisma.recurringTraining.delete({
      where: { id },
    });
  },

  /**
   * Count recurring trainings
   */
  async count(where?: Prisma.RecurringTrainingWhereInput) {
    return prisma.recurringTraining.count({ where });
  },
};
