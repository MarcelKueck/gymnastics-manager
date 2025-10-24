import { prisma } from '@/lib/prisma';
import { Prisma, UserRole } from '@prisma/client';

export class TrainerRepository {
  /**
   * Find trainer by ID
   */
  async findById(id: string, include?: Prisma.TrainerInclude) {
    return prisma.trainer.findUnique({
      where: { id },
      include,
    });
  }

  /**
   * Find trainer by email
   */
  async findByEmail(email: string) {
    return prisma.trainer.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  /**
   * Get all trainers
   */
  async findMany(params?: {
    where?: Prisma.TrainerWhereInput;
    include?: Prisma.TrainerInclude;
    orderBy?: Prisma.TrainerOrderByWithRelationInput;
  }) {
    return prisma.trainer.findMany(params);
  }

  /**
   * Get active trainers only
   */
  async findActive() {
    return prisma.trainer.findMany({
      where: { isActive: true },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
  }

  /**
   * Get trainers by role
   */
  async findByRole(role: UserRole) {
    return prisma.trainer.findMany({
      where: { role, isActive: true },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
  }

  /**
   * Create new trainer
   */
  async create(data: Prisma.TrainerCreateInput) {
    return prisma.trainer.create({ data });
  }

  /**
   * Update trainer
   */
  async update(id: string, data: Prisma.TrainerUpdateInput) {
    return prisma.trainer.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete trainer
   */
  async delete(id: string) {
    return prisma.trainer.delete({ where: { id } });
  }

  /**
   * Deactivate trainer
   */
  async deactivate(id: string) {
    return prisma.trainer.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Activate trainer
   */
  async activate(id: string) {
    return prisma.trainer.update({
      where: { id },
      data: { isActive: true },
    });
  }

  /**
   * Count trainers
   */
  async count(where?: Prisma.TrainerWhereInput) {
    return prisma.trainer.count({ where });
  }

  /**
   * Get trainer's assigned training groups
   */
  async getAssignedGroups(trainerId: string) {
    return prisma.recurringTrainingTrainerAssignment.findMany({
      where: { trainerId },
      include: {
        trainingGroup: {
          include: {
            recurringTraining: true,
          },
        },
      },
      orderBy: {
        trainingGroup: {
          recurringTraining: {
            dayOfWeek: 'asc',
          },
        },
      },
    });
  }

  /**
   * Get trainer's upcoming sessions
   */
  async getUpcomingSessions(trainerId: string, limit: number = 10) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return prisma.trainingSession.findMany({
      where: {
        date: { gte: today },
        isCancelled: false,
        groups: {
          some: {
            trainerAssignments: {
              some: { trainerId },
            },
          },
        },
      },
      include: {
        recurringTraining: true,
        groups: {
          include: {
            trainingGroup: true,
            trainerAssignments: {
              where: { trainerId },
            },
          },
        },
      },
      orderBy: { date: 'asc' },
      take: limit,
    });
  }

  /**
   * Get trainer statistics
   */
  async getStatistics(trainerId: string, month?: number, year?: number) {
    const where: Prisma.AttendanceRecordWhereInput = {
      markedBy: trainerId,
      ...(month &&
        year && {
          markedAt: {
            gte: new Date(year, month - 1, 1),
            lt: new Date(year, month, 1),
          },
        }),
    };

    const totalMarked = await prisma.attendanceRecord.count({ where });

    const sessionsConducted = await prisma.trainingSession.count({
      where: {
        isCompleted: true,
        groups: {
          some: {
            trainerAssignments: {
              some: { trainerId },
            },
          },
        },
        ...(month &&
          year && {
            date: {
              gte: new Date(year, month - 1, 1),
              lt: new Date(year, month, 1),
            },
          }),
      },
    });

    return {
      totalMarked,
      sessionsConducted,
    };
  }
}

export const trainerRepository = new TrainerRepository();