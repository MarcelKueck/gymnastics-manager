import { prisma } from '@/lib/prisma';
import { Prisma, UserRole } from '@prisma/client';

export const trainerRepository = {
  /**
   * Find trainer profile by ID
   */
  async findById(id: string, include?: Prisma.TrainerProfileInclude) {
    return prisma.trainerProfile.findUnique({
      where: { id },
      include,
    });
  },

  /**
   * Find trainer profile by user ID
   */
  async findByUserId(userId: string, include?: Prisma.TrainerProfileInclude) {
    return prisma.trainerProfile.findUnique({
      where: { userId },
      include,
    });
  },

  /**
   * Find trainer with user data
   */
  async findWithUser(id: string) {
    return prisma.trainerProfile.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });
  },

  /**
   * Find all trainers (active by default)
   */
  async findMany(options?: {
    where?: Prisma.TrainerProfileWhereInput;
    include?: Prisma.TrainerProfileInclude;
    orderBy?: Prisma.TrainerProfileOrderByWithRelationInput;
    activeOnly?: boolean;
  }) {
    const where: Prisma.TrainerProfileWhereInput = {
      ...options?.where,
      ...(options?.activeOnly !== false && { isActive: true }),
    };

    return prisma.trainerProfile.findMany({
      where,
      include: options?.include ?? { user: true },
      orderBy: options?.orderBy ?? { user: { lastName: 'asc' } },
    });
  },

  /**
   * Find all active trainers (not admins)
   */
  async findActiveTrainers() {
    return prisma.trainerProfile.findMany({
      where: {
        isActive: true,
        role: UserRole.TRAINER,
      },
      include: { user: true },
      orderBy: { user: { lastName: 'asc' } },
    });
  },

  /**
   * Find all admins
   */
  async findAdmins() {
    return prisma.trainerProfile.findMany({
      where: {
        isActive: true,
        role: UserRole.ADMIN,
      },
      include: { user: true },
      orderBy: { user: { lastName: 'asc' } },
    });
  },

  /**
   * Create trainer profile for existing user
   */
  async create(userId: string, role: UserRole = UserRole.TRAINER) {
    return prisma.$transaction(async (tx) => {
      // Update user to be a trainer
      await tx.user.update({
        where: { id: userId },
        data: { isTrainer: true },
      });

      // Create trainer profile
      return tx.trainerProfile.create({
        data: {
          userId,
          role,
        },
        include: { user: true },
      });
    });
  },

  /**
   * Update trainer profile
   */
  async update(id: string, data: Prisma.TrainerProfileUpdateInput) {
    return prisma.trainerProfile.update({
      where: { id },
      data,
    });
  },

  /**
   * Promote trainer to admin
   */
  async promoteToAdmin(id: string) {
    return prisma.trainerProfile.update({
      where: { id },
      data: { role: UserRole.ADMIN },
    });
  },

  /**
   * Demote admin to trainer
   */
  async demoteToTrainer(id: string) {
    return prisma.trainerProfile.update({
      where: { id },
      data: { role: UserRole.TRAINER },
    });
  },

  /**
   * Deactivate trainer
   */
  async deactivate(id: string) {
    return prisma.trainerProfile.update({
      where: { id },
      data: { isActive: false },
    });
  },

  /**
   * Reactivate trainer
   */
  async reactivate(id: string) {
    return prisma.trainerProfile.update({
      where: { id },
      data: { isActive: true },
    });
  },

  /**
   * Count trainers
   */
  async count(where?: Prisma.TrainerProfileWhereInput) {
    return prisma.trainerProfile.count({ where });
  },

  /**
   * Get trainer's assigned training groups
   */
  async getTrainingAssignments(trainerId: string) {
    return prisma.recurringTrainingTrainerAssignment.findMany({
      where: { trainerId },
      include: {
        trainingGroup: {
          include: {
            recurringTraining: true,
          },
        },
      },
    });
  },
};
