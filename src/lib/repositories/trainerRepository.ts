import { prisma } from '@/lib/prisma';
import { Prisma, UserRole } from '@prisma/client';

export class TrainerRepository {
  /**
   * Find trainer profile by ID
   */
  async findById(id: string, include?: Prisma.TrainerProfileInclude) {
    return prisma.trainerProfile.findUnique({
      where: { id },
      include: {
        user: true,
        ...include,
      },
    });
  }

  /**
   * Find trainer by user email
   */
  async findByEmail(email: string) {
    return prisma.trainerProfile.findFirst({
      where: { 
        user: {
          email: email.toLowerCase(),
        },
      },
      include: { user: true },
    });
  }

  /**
   * Get all trainer profiles
   */
  async findMany(params?: {
    where?: Prisma.TrainerProfileWhereInput;
    include?: Prisma.TrainerProfileInclude;
    orderBy?: Prisma.TrainerProfileOrderByWithRelationInput;
  }) {
    return prisma.trainerProfile.findMany({
      ...params,
      include: {
        user: true,
        ...params?.include,
      },
    });
  }

  /**
   * Get active trainers only
   */
  async findActive() {
    return prisma.trainerProfile.findMany({
      where: { isActive: true },
      include: { user: true },
    });
  }

  /**
   * Get trainers by role
   */
  async findByRole(role: UserRole) {
    return prisma.trainerProfile.findMany({
      where: { role, isActive: true },
      include: { user: true },
    });
  }

  /**
   * Update trainer profile
   */
  async update(id: string, data: Prisma.TrainerProfileUpdateInput) {
    return prisma.trainerProfile.update({
      where: { id },
      data,
      include: { user: true },
    });
  }

  /**
   * Create new user with trainer profile (admin-created)
   */
  async create(userData: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    phone: string;
    birthDate?: Date;
    gender?: string;
    role: UserRole;
  }) {
    return prisma.user.create({
      data: {
        email: userData.email,
        passwordHash: userData.passwordHash,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        birthDate: userData.birthDate,
        gender: userData.gender as any,
        isTrainer: true,
        trainerProfile: {
          create: {
            role: userData.role,
            isActive: true,
          },
        },
      },
      include: {
        trainerProfile: true,
      },
    });
  }

  /**
   * Delete trainer profile
   */
  async delete(id: string) {
    return prisma.trainerProfile.delete({ where: { id } });
  }

  /**
   * Deactivate trainer
   */
  async deactivate(id: string) {
    return prisma.trainerProfile.update({
      where: { id },
      data: { isActive: false },
      include: { user: true },
    });
  }

  /**
   * Activate trainer
   */
  async activate(id: string) {
    return prisma.trainerProfile.update({
      where: { id },
      data: { isActive: true },
      include: { user: true },
    });
  }

  /**
   * Count trainer profiles
   */
  async count(where?: Prisma.TrainerProfileWhereInput) {
    return prisma.trainerProfile.count({ where });
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
