import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class SessionRepository {
  /**
   * Find session by ID
   */
  async findById(id: string, include?: Prisma.TrainingSessionInclude) {
    return prisma.trainingSession.findUnique({
      where: { id },
      include,
    });
  }

  /**
   * Get sessions with filters
   */
  async findMany(params: {
    where?: Prisma.TrainingSessionWhereInput;
    include?: Prisma.TrainingSessionInclude;
    orderBy?: Prisma.TrainingSessionOrderByWithRelationInput;
    skip?: number;
    take?: number;
  }) {
    return prisma.trainingSession.findMany(params);
  }

  /**
   * Get upcoming sessions
   */
  async findUpcoming(limit: number = 10, includeToday: boolean = true) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return prisma.trainingSession.findMany({
      where: {
        date: includeToday ? { gte: today } : { gt: today },
        isCancelled: false,
      },
      include: {
        recurringTraining: true,
        groups: {
          include: {
            trainingGroup: true,
            trainerAssignments: {
              include: { trainer: true },
            },
          },
        },
        cancellations: {
          where: { isActive: true },
          include: { athlete: true },
        },
      },
      orderBy: { date: 'asc' },
      take: limit,
    });
  }

  /**
   * Get sessions in date range
   */
  async findByDateRange(startDate: Date, endDate: Date) {
    return prisma.trainingSession.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        recurringTraining: true,
        groups: {
          include: {
            trainingGroup: true,
          },
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  /**
   * Get sessions for a specific athlete
   */
  async findByAthlete(athleteId: string, dateFrom?: Date, dateTo?: Date) {
    const where: Prisma.TrainingSessionWhereInput = {
      OR: [
        {
          groups: {
            some: {
              trainingGroup: {
                athleteAssignments: {
                  some: { athleteId },
                },
              },
            },
          },
        },
        {
          sessionAthleteAssignments: {
            some: { athleteId },
          },
        },
      ],
      ...(dateFrom && { date: { gte: dateFrom } }),
      ...(dateTo && { date: { lte: dateTo } }),
    };

    return prisma.trainingSession.findMany({
      where,
      include: {
        recurringTraining: true,
        groups: {
          include: {
            trainingGroup: true,
          },
        },
        cancellations: {
          where: { athleteId, isActive: true },
        },
        attendanceRecords: {
          where: { athleteId },
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  /**
   * Get sessions for a specific trainer
   */
  async findByTrainer(trainerId: string, dateFrom?: Date, dateTo?: Date) {
    const where: Prisma.TrainingSessionWhereInput = {
      OR: [
        {
          // Sessions where trainer is assigned to a group in the recurring training
          groups: {
            some: {
              trainingGroup: {
                trainerAssignments: {
                  some: { trainerId },
                },
              },
            },
          },
        },
        {
          // Sessions where trainer is assigned to a specific session group
          groups: {
            some: {
              trainerAssignments: {
                some: { trainerId },
              },
            },
          },
        },
      ],
      ...(dateFrom && { date: { gte: dateFrom } }),
      ...(dateTo && { date: { lte: dateTo } }),
    };

    return prisma.trainingSession.findMany({
      where,
      include: {
        recurringTraining: true,
        groups: {
          include: {
            trainingGroup: true,
          },
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  /**
   * Create session
   */
  async create(data: Prisma.TrainingSessionCreateInput) {
    return prisma.trainingSession.create({
      data,
      include: {
        groups: true,
      },
    });
  }

  /**
   * Update session
   */
  async update(id: string, data: Prisma.TrainingSessionUpdateInput) {
    return prisma.trainingSession.update({
      where: { id },
      data,
    });
  }

  /**
   * Cancel session
   */
  async cancel(id: string, cancelledBy: string, reason: string) {
    return prisma.trainingSession.update({
      where: { id },
      data: {
        isCancelled: true,
        cancelledBy,
        cancelledAt: new Date(),
        cancellationReason: reason,
      },
    });
  }

  /**
   * Mark session as completed
   */
  async markCompleted(id: string) {
    return prisma.trainingSession.update({
      where: { id },
      data: { isCompleted: true },
    });
  }

  /**
   * Delete session
   */
  async delete(id: string) {
    return prisma.trainingSession.delete({ where: { id } });
  }

  /**
   * Get or create session group
   */
  async getOrCreateSessionGroup(sessionId: string, trainingGroupId: string) {
    const existing = await prisma.sessionGroup.findUnique({
      where: {
        trainingSessionId_trainingGroupId: {
          trainingSessionId: sessionId,
          trainingGroupId,
        },
      },
    });

    if (existing) return existing;

    return prisma.sessionGroup.create({
      data: {
        trainingSessionId: sessionId,
        trainingGroupId,
      },
    });
  }

  /**
   * Update session group
   */
  async updateSessionGroup(id: string, data: Prisma.SessionGroupUpdateInput) {
    return prisma.sessionGroup.update({
      where: { id },
      data,
    });
  }

  /**
   * Assign trainer to session group
   */
  async assignTrainerToSessionGroup(sessionGroupId: string, trainerId: string) {
    return prisma.sessionGroupTrainerAssignment.create({
      data: {
        sessionGroupId,
        trainerId,
      },
    });
  }

  /**
   * Reassign athlete for session
   */
  async reassignAthlete(
    sessionId: string,
    sessionGroupId: string,
    athleteId: string,
    movedBy: string,
    reason?: string
  ) {
    // Delete existing assignment if any
    await prisma.sessionAthleteAssignment.deleteMany({
      where: {
        trainingSessionId: sessionId,
        athleteId,
      },
    });

    // Create new assignment
    return prisma.sessionAthleteAssignment.create({
      data: {
        trainingSessionId: sessionId,
        sessionGroupId,
        athleteId,
        movedBy,
        reason,
      },
    });
  }

  /**
   * Count sessions
   */
  async count(where?: Prisma.TrainingSessionWhereInput) {
    return prisma.trainingSession.count({ where });
  }

  /**
   * Check if session exists
   */
  async exists(date: Date, recurringTrainingId: string) {
    const session = await prisma.trainingSession.findUnique({
      where: {
        date_recurringTrainingId: {
          date,
          recurringTrainingId,
        },
      },
    });
    return !!session;
  }
}

export const sessionRepository = new SessionRepository();