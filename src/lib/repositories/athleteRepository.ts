import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const athleteRepository = {
  /**
   * Find athlete profile by ID
   */
  async findById(id: string, include?: Prisma.AthleteProfileInclude) {
    return prisma.athleteProfile.findUnique({
      where: { id },
      include,
    });
  },

  /**
   * Find athlete profile by user ID
   */
  async findByUserId(userId: string, include?: Prisma.AthleteProfileInclude) {
    return prisma.athleteProfile.findUnique({
      where: { userId },
      include,
    });
  },

  /**
   * Find athlete with user data
   */
  async findWithUser(id: string) {
    return prisma.athleteProfile.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });
  },

  /**
   * Find all athletes with optional filtering
   */
  async findMany(options?: {
    where?: Prisma.AthleteProfileWhereInput;
    include?: Prisma.AthleteProfileInclude;
    orderBy?: Prisma.AthleteProfileOrderByWithRelationInput;
    skip?: number;
    take?: number;
  }) {
    return prisma.athleteProfile.findMany({
      ...options,
      include: options?.include ?? { user: true },
    });
  },

  /**
   * Find all approved athletes
   */
  async findApproved(include?: Prisma.AthleteProfileInclude) {
    return prisma.athleteProfile.findMany({
      where: { isApproved: true },
      include: include ?? { user: true },
      orderBy: { user: { lastName: 'asc' } },
    });
  },

  /**
   * Find all pending (unapproved) athletes
   */
  async findPending(include?: Prisma.AthleteProfileInclude) {
    return prisma.athleteProfile.findMany({
      where: { isApproved: false },
      include: include ?? { user: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Update athlete profile
   */
  async update(id: string, data: Prisma.AthleteProfileUpdateInput) {
    return prisma.athleteProfile.update({
      where: { id },
      data,
    });
  },

  /**
   * Approve an athlete
   */
  async approve(id: string, approvedByTrainerId: string) {
    return prisma.athleteProfile.update({
      where: { id },
      data: {
        isApproved: true,
        approvedBy: approvedByTrainerId,
        approvedAt: new Date(),
      },
    });
  },

  /**
   * Count athletes with optional filtering
   */
  async count(where?: Prisma.AthleteProfileWhereInput) {
    return prisma.athleteProfile.count({ where });
  },

  /**
   * Get athletes by training group
   */
  async findByTrainingGroup(trainingGroupId: string) {
    return prisma.athleteProfile.findMany({
      where: {
        recurringTrainingAssignments: {
          some: { trainingGroupId },
        },
      },
      include: { user: true },
      orderBy: { user: { lastName: 'asc' } },
    });
  },

  /**
   * Get athlete's training assignments
   */
  async getTrainingAssignments(athleteId: string) {
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
  },
};
