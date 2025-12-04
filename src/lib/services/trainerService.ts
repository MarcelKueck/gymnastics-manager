import { trainerRepository, athleteRepository } from '@/lib/repositories';
import { prisma } from '@/lib/prisma';
import { AttendanceStatus } from '@prisma/client';

export const trainerService = {
  /**
   * Get trainer dashboard data
   */
  async getDashboard(trainerProfileId: string) {
    const [profile, upcomingSessions, pendingAthletes, todaysSessions] = await Promise.all([
      trainerRepository.findWithUser(trainerProfileId),
      this.getUpcomingSessions(trainerProfileId, 5),
      athleteRepository.findPending(),
      this.getTodaysSessions(trainerProfileId),
    ]);

    return {
      profile,
      upcomingSessions,
      pendingAthletes,
      todaysSessions,
    };
  },

  /**
   * Get upcoming sessions for trainer
   */
  async getUpcomingSessions(trainerProfileId: string, limit = 10) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Get trainer's assigned groups
    const assignments = await prisma.recurringTrainingTrainerAssignment.findMany({
      where: { trainerId: trainerProfileId },
      select: { trainingGroupId: true },
    });

    const trainingGroupIds = assignments.map((a) => a.trainingGroupId);

    return prisma.trainingSession.findMany({
      where: {
        date: { gte: now },
        isCancelled: false,
        sessionGroups: {
          some: { trainingGroupId: { in: trainingGroupIds } },
        },
      },
      include: {
        recurringTraining: true,
        sessionGroups: {
          where: { trainingGroupId: { in: trainingGroupIds } },
          include: { trainingGroup: true },
        },
      },
      orderBy: { date: 'asc' },
      take: limit,
    });
  },

  /**
   * Get today's sessions for trainer
   */
  async getTodaysSessions(trainerProfileId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const assignments = await prisma.recurringTrainingTrainerAssignment.findMany({
      where: { trainerId: trainerProfileId },
      select: { trainingGroupId: true },
    });

    const trainingGroupIds = assignments.map((a) => a.trainingGroupId);

    return prisma.trainingSession.findMany({
      where: {
        date: { gte: today, lt: tomorrow },
        isCancelled: false,
        sessionGroups: {
          some: { trainingGroupId: { in: trainingGroupIds } },
        },
      },
      include: {
        recurringTraining: true,
        sessionGroups: {
          include: { trainingGroup: true },
        },
        attendanceRecords: true,
      },
      orderBy: { recurringTraining: { startTime: 'asc' } },
    });
  },

  /**
   * Get session details with attendance for marking
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getSessionForAttendance(sessionId: string, _trainerProfileId?: string) {
    const session = await prisma.trainingSession.findUnique({
      where: { id: sessionId },
      include: {
        recurringTraining: true,
        sessionGroups: {
          include: {
            trainingGroup: {
              include: {
                athleteAssignments: {
                  include: { athlete: { include: { user: true } } },
                },
              },
            },
          },
        },
        attendanceRecords: {
          include: { athlete: { include: { user: true } } },
        },
        cancellations: {
          where: { isActive: true },
          include: { athlete: { include: { user: true } } },
        },
      },
    });

    if (!session) {
      throw new Error('Trainingseinheit nicht gefunden');
    }

    // Build attendance list with status
    const athletes = session.sessionGroups.flatMap((sg) =>
      sg.trainingGroup.athleteAssignments.map((aa) => {
        const attendanceRecord = session.attendanceRecords.find(
          (ar) => ar.athleteId === aa.athleteId
        );
        const cancellation = session.cancellations.find(
          (c) => c.athleteId === aa.athleteId
        );

        return {
          athlete: aa.athlete,
          groupName: sg.trainingGroup.name,
          attendanceRecord,
          hasCancelled: !!cancellation,
          cancellationReason: cancellation?.reason,
        };
      })
    );

    return {
      session,
      athletes,
    };
  },

  /**
   * Mark attendance for an athlete
   */
  async markAttendance(
    sessionId: string,
    athleteId: string,
    status: AttendanceStatus,
    trainerProfileId: string,
    notes?: string,
    trainingGroupId?: string
  ) {
    // Check if record exists
    const existing = await prisma.attendanceRecord.findFirst({
      where: {
        athleteId,
        trainingSessionId: sessionId,
        trainingGroupId: trainingGroupId ?? null,
      },
    });

    if (existing) {
      // Update existing record
      return prisma.attendanceRecord.update({
        where: { id: existing.id },
        data: {
          status,
          lastModifiedBy: trainerProfileId,
          lastModifiedAt: new Date(),
          notes,
        },
      });
    }

    // Create new record
    return prisma.attendanceRecord.create({
      data: {
        athleteId,
        trainingSessionId: sessionId,
        status,
        markedBy: trainerProfileId,
        notes,
      },
    });
  },

  /**
   * Bulk mark attendance for multiple athletes
   */
  async bulkMarkAttendance(
    sessionId: string,
    records: { athleteId: string; status: AttendanceStatus }[],
    trainerProfileId: string
  ) {
    const results = await Promise.all(
      records.map((record) =>
        this.markAttendance(sessionId, record.athleteId, record.status, trainerProfileId)
      )
    );

    // Mark session as completed if all athletes have attendance
    const session = await prisma.trainingSession.findUnique({
      where: { id: sessionId },
      include: {
        sessionGroups: {
          include: {
            trainingGroup: {
              include: { athleteAssignments: true },
            },
          },
        },
        attendanceRecords: true,
      },
    });

    if (session) {
      const totalAthletes = session.sessionGroups.reduce(
        (sum, sg) => sum + sg.trainingGroup.athleteAssignments.length,
        0
      );
      const recordedAttendance = session.attendanceRecords.length;

      if (recordedAttendance >= totalAthletes) {
        await prisma.trainingSession.update({
          where: { id: sessionId },
          data: { isCompleted: true },
        });
      }
    }

    return results;
  },

  /**
   * Approve a pending athlete
   */
  async approveAthlete(athleteProfileId: string, trainerProfileId: string) {
    return athleteRepository.approve(athleteProfileId, trainerProfileId);
  },

  /**
   * Reject a pending athlete (delete their account)
   */
  async rejectAthlete(athleteProfileId: string) {
    const profile = await athleteRepository.findById(athleteProfileId);
    if (!profile) {
      throw new Error('Athlet nicht gefunden');
    }

    // Delete user (cascades to athlete profile)
    return prisma.user.delete({
      where: { id: profile.userId },
    });
  },

  /**
   * Get trainer's monthly hours
   */
  async getMonthlyHours(trainerProfileId: string, month: number, year: number) {
    // Get all sessions the trainer was assigned to in the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const sessions = await prisma.trainingSession.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        isCompleted: true,
        isCancelled: false,
        sessionGroups: {
          some: {
            trainerAssignments: {
              some: { trainerId: trainerProfileId },
            },
          },
        },
      },
      include: {
        recurringTraining: true,
      },
    });

    // Calculate hours
    let totalMinutes = 0;
    for (const session of sessions) {
      const startTime = session.startTime ?? session.recurringTraining?.startTime;
      const endTime = session.endTime ?? session.recurringTraining?.endTime;

      if (startTime && endTime) {
        const [startH, startM] = startTime.split(':').map(Number);
        const [endH, endM] = endTime.split(':').map(Number);
        totalMinutes += (endH * 60 + endM) - (startH * 60 + startM);
      }
    }

    return {
      sessions: sessions.length,
      totalMinutes,
      totalHours: Math.round((totalMinutes / 60) * 100) / 100,
    };
  },
};
