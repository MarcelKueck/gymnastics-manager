import { prisma } from '@/lib/prisma';
import { Prisma, YouthCategory } from '@prisma/client';

export class AthleteRepository {
  /**
   * Find athlete profile by ID with optional includes
   */
  async findById(id: string, include?: Prisma.AthleteProfileInclude) {
    return prisma.athleteProfile.findUnique({
      where: { id },
      include: {
        user: true,
        ...include,
      },
    });
  }

  /**
   * Find athlete by user email
   */
  async findByEmail(email: string) {
    return prisma.athleteProfile.findFirst({
      where: { 
        user: {
          email: email.toLowerCase(),
        },
      },
      include: { user: true },
    });
  }

  /**
   * Get all athlete profiles with filters
   */
  async findMany(params: {
    where?: Prisma.AthleteProfileWhereInput;
    include?: Prisma.AthleteProfileInclude;
    orderBy?: Prisma.AthleteProfileOrderByWithRelationInput | Prisma.AthleteProfileOrderByWithRelationInput[];
    skip?: number;
    take?: number;
  }) {
    return prisma.athleteProfile.findMany({
      ...params,
      include: {
        user: true,
        ...params.include,
      },
    });
  }

  /**
   * Get pending athlete approvals
   */
  async findPendingApprovals() {
    return prisma.athleteProfile.findMany({
      where: { isApproved: false },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            birthDate: true,
            gender: true,
            phone: true,
            createdAt: true,
          },
        },
      },
    });
  }

  /**
   * Get approved athletes
   */
  async findApproved(filters?: {
    youthCategory?: YouthCategory;
    competitionOnly?: boolean;
    search?: string;
  }) {
    const where: Prisma.AthleteProfileWhereInput = {
      isApproved: true,
      ...(filters?.youthCategory && { youthCategory: filters.youthCategory }),
      ...(filters?.competitionOnly && { competitionParticipation: true }),
      ...(filters?.search && {
        user: {
          OR: [
            { firstName: { contains: filters.search, mode: 'insensitive' } },
            { lastName: { contains: filters.search, mode: 'insensitive' } },
            { email: { contains: filters.search, mode: 'insensitive' } },
          ],
        },
      }),
    };

    return prisma.athleteProfile.findMany({
      where,
      include: {
        user: true,
        recurringTrainingAssignments: {
          include: {
            trainingGroup: {
              include: {
                recurringTraining: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Update athlete profile
   */
  async update(id: string, data: Prisma.AthleteProfileUpdateInput) {
    return prisma.athleteProfile.update({
      where: { id },
      data,
      include: { user: true },
    });
  }

  /**
   * Create new user with athlete profile (for registration)
   */
  async create(userData: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    birthDate: Date;
    gender: string;
    phone: string;
    guardianName?: string;
    guardianEmail?: string;
    guardianPhone?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
  }) {
    return prisma.user.create({
      data: {
        email: userData.email,
        passwordHash: userData.passwordHash,
        firstName: userData.firstName,
        lastName: userData.lastName,
        birthDate: userData.birthDate,
        gender: userData.gender as any,
        phone: userData.phone,
        isAthlete: true,
        athleteProfile: {
          create: {
            guardianName: userData.guardianName,
            guardianEmail: userData.guardianEmail,
            guardianPhone: userData.guardianPhone,
            emergencyContactName: userData.emergencyContactName,
            emergencyContactPhone: userData.emergencyContactPhone,
            isApproved: false, // Registration requires approval
          },
        },
      },
      include: {
        athleteProfile: true,
      },
    });
  }

  /**
   * Approve athlete
   */
  async approve(id: string, approvedByTrainerId: string) {
    return prisma.athleteProfile.update({
      where: { id },
      data: {
        isApproved: true,
        approvedBy: approvedByTrainerId,
        approvedAt: new Date(),
        configuredAt: new Date(),
      },
      include: { user: true },
    });
  }

  /**
   * Delete athlete profile
   */
  async delete(id: string) {
    return prisma.athleteProfile.delete({ where: { id } });
  }

  /**
   * Count athlete profiles
   */
  async count(where?: Prisma.AthleteProfileWhereInput) {
    return prisma.athleteProfile.count({ where });
  }

  /**
   * Get athletes by training group
   */
  async findByTrainingGroup(trainingGroupId: string) {
    return prisma.athleteProfile.findMany({
      where: {
        isApproved: true,
        recurringTrainingAssignments: {
          some: {
            trainingGroupId,
          },
        },
      },
      include: { user: true },
    });
  }

  /**
   * Get athlete statistics
   */
  async getStatistics(athleteId: string, dateFrom?: Date, dateTo?: Date) {
    const where: Prisma.AttendanceRecordWhereInput = {
      athleteId,
      ...(dateFrom && {
        trainingSession: {
          date: { gte: dateFrom },
        },
      }),
      ...(dateTo && {
        trainingSession: {
          date: { lte: dateTo },
        },
      }),
    };

    const [total, present, excused, unexcused] = await Promise.all([
      prisma.attendanceRecord.count({ where }),
      prisma.attendanceRecord.count({ where: { ...where, status: 'PRESENT' } }),
      prisma.attendanceRecord.count({ where: { ...where, status: 'ABSENT_EXCUSED' } }),
      prisma.attendanceRecord.count({ where: { ...where, status: 'ABSENT_UNEXCUSED' } }),
    ]);

    return {
      totalSessions: total,
      present,
      excused,
      unexcused,
      attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0,
    };
  }
}

export const athleteRepository = new AthleteRepository();
