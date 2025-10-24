import { prisma } from '@/lib/prisma';
import { Prisma, AttendanceStatus } from '@prisma/client';

export class AttendanceRepository {
  /**
   * Find attendance record by ID
   */
  async findById(id: string) {
    return prisma.attendanceRecord.findUnique({
      where: { id },
      include: {
        athlete: true,
        trainingSession: true,
        markedByTrainer: true,
      },
    });
  }

  /**
   * Find attendance record for athlete and session
   */
  async findByAthleteAndSession(athleteId: string, trainingSessionId: string) {
    return prisma.attendanceRecord.findUnique({
      where: {
        athleteId_trainingSessionId: {
          athleteId,
          trainingSessionId,
        },
      },
      include: {
        markedByTrainer: true,
      },
    });
  }

  /**
   * Get attendance records with filters
   */
  async findMany(params: {
    where?: Prisma.AttendanceRecordWhereInput;
    include?: Prisma.AttendanceRecordInclude;
    orderBy?: Prisma.AttendanceRecordOrderByWithRelationInput;
    skip?: number;
    take?: number;
  }) {
    return prisma.attendanceRecord.findMany(params);
  }

  /**
   * Get attendance for a session
   */
  async findBySession(sessionId: string) {
    return prisma.attendanceRecord.findMany({
      where: { trainingSessionId: sessionId },
      include: {
        athlete: {
          include: { user: true },
        },
        markedByTrainer: {
          include: { user: true },
        },
      },
      orderBy: {
        athlete: {
          user: {
            lastName: 'asc',
          },
        },
      },
    });
  }

  /**
   * Get attendance for an athlete
   */
  async findByAthlete(athleteId: string, dateFrom?: Date, dateTo?: Date) {
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

    return prisma.attendanceRecord.findMany({
      where,
      include: {
        trainingSession: {
          include: {
            recurringTraining: true,
          },
        },
        markedByTrainer: true,
      },
      orderBy: {
        trainingSession: {
          date: 'desc',
        },
      },
    });
  }

  /**
   * Mark attendance
   */
  async mark(
    athleteId: string,
    trainingSessionId: string,
    status: AttendanceStatus,
    markedBy: string,
    notes?: string
  ) {
    return prisma.attendanceRecord.upsert({
      where: {
        athleteId_trainingSessionId: {
          athleteId,
          trainingSessionId,
        },
      },
      create: {
        athleteId,
        trainingSessionId,
        status,
        markedBy,
        notes,
        markedAt: new Date(),
      },
      update: {
        status,
        lastModifiedBy: markedBy,
        lastModifiedAt: new Date(),
        notes,
      },
      include: {
        athlete: true,
        trainingSession: true,
      },
    });
  }

  /**
   * Bulk mark attendance
   */
  async bulkMark(
    records: Array<{
      athleteId: string;
      trainingSessionId: string;
      status: AttendanceStatus;
      notes?: string;
    }>,
    markedBy: string
  ) {
    const operations = records.map((record) =>
      this.mark(
        record.athleteId,
        record.trainingSessionId,
        record.status,
        markedBy,
        record.notes
      )
    );

    return Promise.all(operations);
  }

  /**
   * Update attendance
   */
  async update(
    id: string,
    status: AttendanceStatus,
    modifiedBy: string,
    modificationReason: string,
    notes?: string
  ) {
    return prisma.attendanceRecord.update({
      where: { id },
      data: {
        status,
        lastModifiedBy: modifiedBy,
        lastModifiedAt: new Date(),
        modificationReason,
        notes,
      },
    });
  }

  /**
   * Delete attendance record
   */
  async delete(id: string) {
    return prisma.attendanceRecord.delete({ where: { id } });
  }

  /**
   * Find cancellation by ID
   */
  async findCancellationById(id: string) {
    return prisma.cancellation.findUnique({
      where: { id },
      include: {
        athlete: true,
        trainingSession: true,
      },
    });
  }

  /**
   * Get active cancellations for athlete
   */
  async findActiveCancellations(athleteId: string) {
    return prisma.cancellation.findMany({
      where: {
        athleteId,
        isActive: true,
        trainingSession: {
          date: { gte: new Date() },
        },
      },
      include: {
        trainingSession: {
          include: {
            recurringTraining: true,
          },
        },
      },
      orderBy: {
        trainingSession: {
          date: 'asc',
        },
      },
    });
  }

  /**
   * Create cancellation
   */
  async createCancellation(
    athleteId: string,
    trainingSessionId: string,
    reason: string
  ) {
    return prisma.cancellation.create({
      data: {
        athleteId,
        trainingSessionId,
        reason,
      },
    });
  }

  /**
   * Undo cancellation
   */
  async undoCancellation(id: string) {
    return prisma.cancellation.update({
      where: { id },
      data: {
        isActive: false,
        undoneAt: new Date(),
      },
    });
  }

  /**
   * Count attendance by status
   */
  async countByStatus(athleteId: string, status: AttendanceStatus, dateFrom?: Date, dateTo?: Date) {
    const where: Prisma.AttendanceRecordWhereInput = {
      athleteId,
      status,
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

    return prisma.attendanceRecord.count({ where });
  }

  /**
   * Get athletes with consecutive absences
   */
  async findAthletesWithConsecutiveAbsences(threshold: number = 3) {
    // This is a complex query - we'll fetch all attendance and process in memory
    const recentSessions = await prisma.trainingSession.findMany({
      where: {
        date: {
          lte: new Date(),
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
        isCompleted: true,
      },
      include: {
        attendanceRecords: {
          where: {
            status: {
              in: ['ABSENT_UNEXCUSED', 'ABSENT_EXCUSED'],
            },
          },
          include: {
            athlete: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Group by athlete and count consecutive absences
    const athleteAbsences = new Map<string, { athlete: any; count: number }>();

    for (const session of recentSessions) {
      for (const record of session.attendanceRecords) {
        const existing = athleteAbsences.get(record.athleteId);
        if (existing) {
          existing.count++;
        } else {
          athleteAbsences.set(record.athleteId, {
            athlete: record.athlete,
            count: 1,
          });
        }
      }
    }

    return Array.from(athleteAbsences.values())
      .filter((item) => item.count >= threshold)
      .map((item) => ({
        ...item.athlete,
        consecutiveAbsences: item.count,
      }));
  }
}

export const attendanceRepository = new AttendanceRepository();