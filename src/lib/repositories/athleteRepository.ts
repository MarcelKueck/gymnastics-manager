import { prisma } from '@/lib/prisma';
import { Prisma, YouthCategory } from '@prisma/client';

export class AthleteRepository {
  /**
   * Find athlete by ID with optional includes
   */
  async findById(id: string, include?: Prisma.AthleteInclude) {
    return prisma.athlete.findUnique({
      where: { id },
      include,
    });
  }

  /**
   * Find athlete by email
   */
  async findByEmail(email: string) {
    return prisma.athlete.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  /**
   * Get all athletes with filters
   */
  async findMany(params: {
    where?: Prisma.AthleteWhereInput;
    include?: Prisma.AthleteInclude;
    orderBy?: Prisma.AthleteOrderByWithRelationInput | Prisma.AthleteOrderByWithRelationInput[];
    skip?: number;
    take?: number;
  }) {
    return prisma.athlete.findMany(params);
  }

  /**
   * Get pending athlete approvals
   */
  async findPendingApprovals() {
    return prisma.athlete.findMany({
      where: { isApproved: false },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        birthDate: true,
        gender: true,
        phone: true,
        guardianName: true,
        guardianEmail: true,
        guardianPhone: true,
        createdAt: true,
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
    const where: Prisma.AthleteWhereInput = {
      isApproved: true,
      ...(filters?.youthCategory && { youthCategory: filters.youthCategory }),
      ...(filters?.competitionOnly && { competitionParticipation: true }),
      ...(filters?.search && {
        OR: [
          { firstName: { contains: filters.search, mode: 'insensitive' } },
          { lastName: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
    };

    return prisma.athlete.findMany({
      where,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      include: {
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
   * Create new athlete
   */
  async create(data: Prisma.AthleteCreateInput) {
    return prisma.athlete.create({ data });
  }

  /**
   * Update athlete
   */
  async update(id: string, data: Prisma.AthleteUpdateInput) {
    return prisma.athlete.update({
      where: { id },
      data,
    });
  }

  /**
   * Approve athlete
   */
  async approve(id: string, approvedBy: string) {
    return prisma.athlete.update({
      where: { id },
      data: {
        isApproved: true,
        approvedBy,
        approvedAt: new Date(),
        configuredAt: new Date(),
      },
    });
  }

  /**
   * Delete athlete
   */
  async delete(id: string) {
    return prisma.athlete.delete({ where: { id } });
  }

  /**
   * Count athletes
   */
  async count(where?: Prisma.AthleteWhereInput) {
    return prisma.athlete.count({ where });
  }

  /**
   * Get athletes by training group
   */
  async findByTrainingGroup(trainingGroupId: string) {
    return prisma.athlete.findMany({
      where: {
        isApproved: true,
        recurringTrainingAssignments: {
          some: {
            trainingGroupId,
          },
        },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
  }

  /**
   * Get athletes for a specific session
   */
  async findBySession(sessionId: string) {
    const session = await prisma.trainingSession.findUnique({
      where: { id: sessionId },
      include: {
        groups: {
          include: {
            trainingGroup: {
              include: {
                athleteAssignments: {
                  include: {
                    athlete: true,
                  },
                },
              },
            },
          },
        },
        sessionAthleteAssignments: {
          include: {
            athlete: true,
            sessionGroup: true,
          },
        },
      },
    });

    if (!session) return [];

    // Collect all athletes from groups and session-specific assignments
    const athleteMap = new Map();

    // Add athletes from recurring assignments
    session.groups.forEach((sessionGroup) => {
      sessionGroup.trainingGroup.athleteAssignments.forEach((assignment) => {
        if (!athleteMap.has(assignment.athlete.id)) {
          athleteMap.set(assignment.athlete.id, {
            ...assignment.athlete,
            sessionGroupId: sessionGroup.id,
          });
        }
      });
    });

    // Override with session-specific assignments
    session.sessionAthleteAssignments.forEach((assignment) => {
      athleteMap.set(assignment.athlete.id, {
        ...assignment.athlete,
        sessionGroupId: assignment.sessionGroupId,
      });
    });

    return Array.from(athleteMap.values());
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