import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const userRepository = {
  /**
   * Find user by ID with optional includes
   */
  async findById(id: string, include?: Prisma.UserInclude) {
    return prisma.user.findUnique({
      where: { id },
      include,
    });
  },

  /**
   * Find user by email with optional includes
   */
  async findByEmail(email: string, include?: Prisma.UserInclude) {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include,
    });
  },

  /**
   * Find user with both profiles
   */
  async findWithProfiles(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        athleteProfile: true,
        trainerProfile: true,
      },
    });
  },

  /**
   * Create a new user
   */
  async create(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data });
  },

  /**
   * Update user by ID
   */
  async update(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({
      where: { id },
      data,
    });
  },

  /**
   * Delete user by ID
   */
  async delete(id: string) {
    return prisma.user.delete({
      where: { id },
    });
  },

  /**
   * Find all users with optional filtering
   */
  async findMany(options?: {
    where?: Prisma.UserWhereInput;
    include?: Prisma.UserInclude;
    orderBy?: Prisma.UserOrderByWithRelationInput;
    skip?: number;
    take?: number;
  }) {
    return prisma.user.findMany(options);
  },

  /**
   * Count users with optional filtering
   */
  async count(where?: Prisma.UserWhereInput) {
    return prisma.user.count({ where });
  },
};
