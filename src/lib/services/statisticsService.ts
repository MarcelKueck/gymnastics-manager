import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths } from 'date-fns';
import { AttendanceStatus } from '@prisma/client';

export class StatisticsService {
  /**
   * Get athlete dashboard statistics
   */
  async getAthleteDashboardStats(athleteId: string) {
    const today = new Date();
    const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 });
    const endOfCurrentWeek = endOfWeek(today, { weekStartsOn: 1 });

    // Next training session
    const nextSession = await prisma.trainingSession.findFirst({
      where: {
        date: { gte: today },
        isCancelled: false,
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
      },
      include: {
        recurringTraining: true,
        cancellations: {
          where: { athleteId, isActive: true },
        },
      },
      orderBy: { date: 'asc' },
    });

    // Upcoming sessions this week
    const upcomingSessions = await prisma.trainingSession.count({
      where: {
        date: {
          gte: startOfCurrentWeek,
          lte: endOfCurrentWeek,
        },
        isCancelled: false,
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
      },
    });

    // Recent attendance (last 5 sessions)
    const recentAttendance = await prisma.attendanceRecord.findMany({
      where: { athleteId },
      include: {
        trainingSession: {
          include: {
            recurringTraining: true,
          },
        },
      },
      orderBy: {
        trainingSession: {
          date: 'desc',
        },
      },
      take: 5,
    });

    // Active cancellations
    const activeCancellations = await prisma.cancellation.count({
      where: {
        athleteId,
        isActive: true,
        trainingSession: {
          date: { gte: today },
        },
      },
    });

    // Monthly attendance stats
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);

    const [monthlyTotal, monthlyPresent] = await Promise.all([
      prisma.attendanceRecord.count({
        where: {
          athleteId,
          trainingSession: {
            date: {
              gte: monthStart,
              lte: monthEnd,
            },
          },
        },
      }),
      prisma.attendanceRecord.count({
        where: {
          athleteId,
          status: AttendanceStatus.PRESENT,
          trainingSession: {
            date: {
              gte: monthStart,
              lte: monthEnd,
            },
          },
        },
      }),
    ]);

    const monthlyAttendanceRate =
      monthlyTotal > 0 ? Math.round((monthlyPresent / monthlyTotal) * 100) : 0;

    return {
      nextSession,
      upcomingSessions,
      recentAttendance,
      activeCancellations,
      monthlyAttendanceRate,
      monthlyTotal,
      monthlyPresent,
    };
  }

  /**
   * Get trainer dashboard statistics
   */
  async getTrainerDashboardStats(trainerId: string) {
    const today = new Date();
    const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 });
    const endOfCurrentWeek = endOfWeek(today, { weekStartsOn: 1 });

    // Upcoming sessions this week
    const upcomingSessions = await prisma.trainingSession.findMany({
      where: {
        date: {
          gte: today,
          lte: endOfCurrentWeek,
        },
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
          },
        },
      },
      orderBy: { date: 'asc' },
      take: 10,
    });

    // Pending athlete approvals
    const pendingApprovals = await prisma.athlete.count({
      where: { isApproved: false },
    });

    // Athletes needing attention (3+ consecutive absences)
    const athletesNeedingAttention = await this.getAthletesWithAbsenceAlerts(3);

    // Sessions conducted this week
    const sessionsConducted = await prisma.trainingSession.count({
      where: {
        date: {
          gte: startOfCurrentWeek,
          lte: endOfCurrentWeek,
        },
        isCompleted: true,
        groups: {
          some: {
            trainerAssignments: {
              some: { trainerId },
            },
          },
        },
      },
    });

    // Attendance marked this week
    const attendanceMarked = await prisma.attendanceRecord.count({
      where: {
        markedBy: trainerId,
        markedAt: {
          gte: startOfCurrentWeek,
          lte: endOfCurrentWeek,
        },
      },
    });

    return {
      upcomingSessions,
      pendingApprovals,
      athletesNeedingAttention: athletesNeedingAttention.length,
      sessionsConducted,
      attendanceMarked,
    };
  }

  /**
   * Get admin dashboard statistics
   */
  async getAdminDashboardStats() {
    const today = new Date();
    const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 });
    const endOfCurrentWeek = endOfWeek(today, { weekStartsOn: 1 });
    const startOfCurrentMonth = startOfMonth(today);

    // Core counts
    const [
      totalAthletes,
      totalTrainers,
      pendingApprovals,
      activeRecurringTrainings,
      todaySessions,
      weekSessions,
    ] = await Promise.all([
      prisma.athlete.count({ where: { isApproved: true } }),
      prisma.trainer.count({ where: { isActive: true } }),
      prisma.athlete.count({ where: { isApproved: false } }),
      prisma.recurringTraining.count({ where: { isActive: true } }),
      prisma.trainingSession.count({
        where: {
          date: {
            gte: new Date(today.setHours(0, 0, 0, 0)),
            lt: new Date(today.setHours(23, 59, 59, 999)),
          },
          isCancelled: false,
        },
      }),
      prisma.trainingSession.count({
        where: {
          date: {
            gte: startOfCurrentWeek,
            lte: endOfCurrentWeek,
          },
          isCancelled: false,
        },
      }),
    ]);

    // Recent registrations (last 7 days)
    const recentRegistrations = await prisma.athlete.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    // Cancelled sessions this week
    const cancelledSessionsThisWeek = await prisma.trainingSession.count({
      where: {
        date: {
          gte: startOfCurrentWeek,
          lte: endOfCurrentWeek,
        },
        isCancelled: true,
      },
    });

    // Active uploads
    const totalUploads = await prisma.upload.count({
      where: { isActive: true },
    });

    // Recent approvals
    const recentApprovals = await prisma.athlete.findMany({
      where: {
        isApproved: true,
        approvedAt: { not: null },
      },
      include: {
        approvedByTrainer: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { approvedAt: 'desc' },
      take: 5,
    });

    // Absence alerts
    const absenceAlerts = await this.getAthletesWithAbsenceAlerts(3);

    return {
      totalAthletes,
      totalTrainers,
      pendingApprovals,
      activeRecurringTrainings,
      todaySessions,
      weekSessions,
      recentRegistrations,
      cancelledSessionsThisWeek,
      totalUploads,
      recentApprovals,
      alertCount: absenceAlerts.length,
    };
  }

  /**
   * Get attendance statistics for a date range
   */
  async getAttendanceStatistics(dateFrom: Date, dateTo: Date) {
    const records = await prisma.attendanceRecord.findMany({
      where: {
        trainingSession: {
          date: {
            gte: dateFrom,
            lte: dateTo,
          },
        },
      },
      include: {
        athlete: true,
        trainingSession: {
          include: {
            recurringTraining: true,
          },
        },
      },
    });

    const totalSessions = new Set(records.map((r) => r.trainingSessionId)).size;
    const present = records.filter((r) => r.status === AttendanceStatus.PRESENT).length;
    const excused = records.filter((r) => r.status === AttendanceStatus.ABSENT_EXCUSED).length;
    const unexcused = records.filter((r) => r.status === AttendanceStatus.ABSENT_UNEXCUSED).length;
    const total = records.length;

    const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;

    // By youth category
    const byCategory = await this.groupAttendanceByCategory(records);

    // By training
    const byTraining = await this.groupAttendanceByTraining(records);

    return {
      totalSessions,
      totalRecords: total,
      present,
      excused,
      unexcused,
      attendanceRate,
      byCategory,
      byTraining,
    };
  }

  /**
   * Group attendance by youth category
   */
  private async groupAttendanceByCategory(records: any[]) {
    const categories = ['F', 'E', 'D'];
    const result: Record<string, any> = {};

    for (const category of categories) {
      const categoryRecords = records.filter(
        (r) => r.athlete.youthCategory === category
      );
      const present = categoryRecords.filter(
        (r) => r.status === AttendanceStatus.PRESENT
      ).length;
      const total = categoryRecords.length;

      result[category] = {
        total,
        present,
        rate: total > 0 ? Math.round((present / total) * 100) : 0,
      };
    }

    return result;
  }

  /**
   * Group attendance by training
   */
  private async groupAttendanceByTraining(records: any[]) {
    const byTraining = new Map<string, any>();

    records.forEach((record) => {
      const trainingId = record.trainingSession.recurringTrainingId;
      if (!trainingId) return;

      if (!byTraining.has(trainingId)) {
        byTraining.set(trainingId, {
          name: record.trainingSession.recurringTraining?.name || 'Unknown',
          total: 0,
          present: 0,
        });
      }

      const stats = byTraining.get(trainingId);
      stats.total++;
      if (record.status === AttendanceStatus.PRESENT) {
        stats.present++;
      }
    });

    return Array.from(byTraining.values()).map((stats) => ({
      ...stats,
      rate: stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0,
    }));
  }

  /**
   * Get athletes with absence alerts
   */
  async getAthletesWithAbsenceAlerts(threshold: number = 3) {
    // Get recent sessions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sessions = await prisma.trainingSession.findMany({
      where: {
        date: {
          gte: thirtyDaysAgo,
          lte: new Date(),
        },
        isCompleted: true,
      },
      include: {
        attendanceRecords: {
          where: {
            status: {
              in: [AttendanceStatus.ABSENT_EXCUSED, AttendanceStatus.ABSENT_UNEXCUSED],
            },
          },
          include: {
            athlete: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Count consecutive absences per athlete
    const athleteAbsences = new Map<string, { athlete: any; count: number; lastSession: Date }>();

    for (const session of sessions) {
      for (const record of session.attendanceRecords) {
        const existing = athleteAbsences.get(record.athleteId);
        if (existing) {
          existing.count++;
          if (session.date > existing.lastSession) {
            existing.lastSession = session.date;
          }
        } else {
          athleteAbsences.set(record.athleteId, {
            athlete: record.athlete,
            count: 1,
            lastSession: session.date,
          });
        }
      }
    }

    return Array.from(athleteAbsences.values())
      .filter((item) => item.count >= threshold)
      .map((item) => ({
        ...item.athlete,
        consecutiveAbsences: item.count,
        lastAbsenceDate: item.lastSession,
      }))
      .sort((a, b) => b.consecutiveAbsences - a.consecutiveAbsences);
  }

  /**
   * Get monthly statistics comparison
   */
  async getMonthlyComparison(months: number = 6) {
    const stats = [];
    const today = new Date();

    for (let i = 0; i < months; i++) {
      const monthDate = subMonths(today, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      const [sessions, attendance] = await Promise.all([
        prisma.trainingSession.count({
          where: {
            date: {
              gte: monthStart,
              lte: monthEnd,
            },
          },
        }),
        prisma.attendanceRecord.findMany({
          where: {
            trainingSession: {
              date: {
                gte: monthStart,
                lte: monthEnd,
              },
            },
          },
        }),
      ]);

      const present = attendance.filter((a) => a.status === AttendanceStatus.PRESENT).length;
      const total = attendance.length;

      stats.push({
        month: monthDate.toLocaleString('de-DE', { month: 'long', year: 'numeric' }),
        sessions,
        totalAttendance: total,
        present,
        rate: total > 0 ? Math.round((present / total) * 100) : 0,
      });
    }

    return stats.reverse();
  }
}

export const statisticsService = new StatisticsService();