import { prisma } from '@/lib/prisma';
import { Prisma, DayOfWeek } from '@prisma/client';

export const trainingSessionRepository = {
  /**
   * Find session by ID
   */
  async findById(id: string, include?: Prisma.TrainingSessionInclude) {
    return prisma.trainingSession.findUnique({
      where: { id },
      include,
    });
  },

  /**
   * Find session with full details
   */
  async findWithDetails(id: string) {
    return prisma.trainingSession.findUnique({
      where: { id },
      include: {
        recurringTraining: true,
        sessionGroups: {
          include: {
            trainingGroup: true,
            trainerAssignments: {
              include: { trainer: { include: { user: true } } },
            },
          },
        },
        attendanceRecords: {
          include: { athlete: { include: { user: true } } },
        },
        cancellations: {
          include: { athlete: { include: { user: true } } },
        },
      },
    });
  },

  /**
   * Find sessions by date range
   */
  async findByDateRange(startDate: Date, endDate: Date, options?: {
    includeCancelled?: boolean;
    recurringTrainingId?: string;
  }) {
    return prisma.trainingSession.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        ...(options?.includeCancelled !== true && { isCancelled: false }),
        ...(options?.recurringTrainingId && { recurringTrainingId: options.recurringTrainingId }),
      },
      include: {
        recurringTraining: true,
        sessionGroups: {
          include: {
            trainingGroup: true,
          },
        },
      },
      orderBy: [{ date: 'asc' }, { recurringTraining: { startTime: 'asc' } }],
    });
  },

  /**
   * Find sessions for a specific date
   */
  async findByDate(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.findByDateRange(startOfDay, endOfDay);
  },

  /**
   * Find upcoming sessions for an athlete
   */
  async findUpcomingForAthlete(athleteId: string, limit = 10) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // First get the athlete's training group assignments
    const assignments = await prisma.recurringTrainingAthleteAssignment.findMany({
      where: { athleteId },
      select: { trainingGroupId: true },
    });

    const trainingGroupIds = assignments.map((a) => a.trainingGroupId);

    return prisma.trainingSession.findMany({
      where: {
        date: { gte: now },
        isCancelled: false,
        sessionGroups: {
          some: {
            trainingGroupId: { in: trainingGroupIds },
          },
        },
      },
      include: {
        recurringTraining: true,
        cancellations: {
          where: { athleteId, isActive: true },
        },
      },
      orderBy: { date: 'asc' },
      take: limit,
    });
  },

  /**
   * Find upcoming sessions for a trainer
   */
  async findUpcomingForTrainer(trainerId: string, limit = 10) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Get trainer's group assignments
    const assignments = await prisma.recurringTrainingTrainerAssignment.findMany({
      where: { trainerId },
      select: { trainingGroupId: true },
    });

    const trainingGroupIds = assignments.map((a) => a.trainingGroupId);

    return prisma.trainingSession.findMany({
      where: {
        date: { gte: now },
        isCancelled: false,
        sessionGroups: {
          some: {
            trainingGroupId: { in: trainingGroupIds },
          },
        },
      },
      include: {
        recurringTraining: true,
        sessionGroups: {
          include: {
            trainingGroup: true,
          },
        },
      },
      orderBy: { date: 'asc' },
      take: limit,
    });
  },

  /**
   * Create a training session
   */
  async create(data: {
    date: Date;
    dayOfWeek: DayOfWeek;
    recurringTrainingId?: string;
    startTime?: string;
    endTime?: string;
    notes?: string;
  }) {
    return prisma.trainingSession.create({
      data: {
        date: data.date,
        dayOfWeek: data.dayOfWeek,
        recurringTrainingId: data.recurringTrainingId,
        startTime: data.startTime,
        endTime: data.endTime,
        notes: data.notes,
      },
    });
  },

  /**
   * Update session
   */
  async update(id: string, data: Prisma.TrainingSessionUpdateInput) {
    return prisma.trainingSession.update({
      where: { id },
      data,
    });
  },

  /**
   * Cancel a session
   */
  async cancel(id: string, cancelledByTrainerId: string, reason?: string) {
    return prisma.trainingSession.update({
      where: { id },
      data: {
        isCancelled: true,
        cancelledBy: cancelledByTrainerId,
        cancelledAt: new Date(),
        cancellationReason: reason,
      },
    });
  },

  /**
   * Mark session as completed
   */
  async complete(id: string) {
    return prisma.trainingSession.update({
      where: { id },
      data: { isCompleted: true },
    });
  },

  /**
   * Check if session exists for a date and recurring training
   */
  async existsForDate(date: Date, recurringTrainingId: string) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const count = await prisma.trainingSession.count({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        recurringTrainingId,
      },
    });

    return count > 0;
  },

  /**
   * Delete session (use with caution)
   */
  async delete(id: string) {
    return prisma.trainingSession.delete({
      where: { id },
    });
  },

  /**
   * Count sessions with optional filtering
   */
  async count(where?: Prisma.TrainingSessionWhereInput) {
    return prisma.trainingSession.count({ where });
  },
};
