import { athleteRepository } from '@/lib/repositories';
import { prisma } from '@/lib/prisma';
import { YouthCategory } from '@prisma/client';

export const athleteService = {
  /**
   * Get athlete dashboard data
   */
  async getDashboard(athleteProfileId: string) {
    const [profile, upcomingSessions, recentAttendance] = await Promise.all([
      athleteRepository.findWithUser(athleteProfileId),
      this.getUpcomingSessions(athleteProfileId, 5),
      this.getRecentAttendance(athleteProfileId, 10),
    ]);

    return {
      profile,
      upcomingSessions,
      recentAttendance,
    };
  },

  /**
   * Get upcoming training sessions for athlete
   */
  async getUpcomingSessions(athleteProfileId: string, limit = 10) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Get athlete's training groups
    const assignments = await prisma.recurringTrainingAthleteAssignment.findMany({
      where: { athleteId: athleteProfileId },
      include: {
        trainingGroup: {
          include: { recurringTraining: true },
        },
      },
    });

    const trainingGroupIds = assignments.map((a) => a.trainingGroupId);

    // Get upcoming sessions
    const sessions = await prisma.trainingSession.findMany({
      where: {
        date: { gte: now },
        isCancelled: false,
        sessionGroups: {
          some: { trainingGroupId: { in: trainingGroupIds } },
        },
      },
      include: {
        recurringTraining: true,
        cancellations: {
          where: { athleteId: athleteProfileId, isActive: true },
        },
      },
      orderBy: { date: 'asc' },
      take: limit,
    });

    return sessions.map((session) => ({
      ...session,
      hasCancelled: session.cancellations.length > 0,
    }));
  },

  /**
   * Get athlete's recent attendance records
   */
  async getRecentAttendance(athleteProfileId: string, limit = 10) {
    return prisma.attendanceRecord.findMany({
      where: { athleteId: athleteProfileId },
      include: {
        trainingSession: {
          include: { recurringTraining: true },
        },
      },
      orderBy: { trainingSession: { date: 'desc' } },
      take: limit,
    });
  },

  /**
   * Cancel athlete's participation in a session
   */
  async cancelSession(
    athleteProfileId: string,
    trainingSessionId: string,
    reason: string
  ) {
    // Validate reason length
    if (reason.length < 10) {
      throw new Error('Begründung muss mindestens 10 Zeichen lang sein');
    }

    // Check if session exists and is in the future
    const session = await prisma.trainingSession.findUnique({
      where: { id: trainingSessionId },
    });

    if (!session) {
      throw new Error('Trainingseinheit nicht gefunden');
    }

    if (session.isCancelled) {
      throw new Error('Trainingseinheit wurde bereits abgesagt');
    }

    const now = new Date();
    if (session.date < now) {
      throw new Error('Vergangene Trainingseinheiten können nicht abgesagt werden');
    }

    // Check cancellation deadline (e.g., 2 hours before)
    const settings = await prisma.systemSettings.findUnique({
      where: { id: 'default' },
    });
    const deadlineHours = settings?.cancellationDeadlineHours ?? 2;

    const sessionDateTime = new Date(session.date);
    // If session has specific start time, use it
    if (session.startTime) {
      const [hours, minutes] = session.startTime.split(':').map(Number);
      sessionDateTime.setHours(hours, minutes, 0, 0);
    }

    const deadline = new Date(sessionDateTime.getTime() - deadlineHours * 60 * 60 * 1000);
    if (now > deadline) {
      throw new Error(
        `Absagen sind nur bis ${deadlineHours} Stunden vor Trainingsbeginn möglich`
      );
    }

    // Create cancellation
    return prisma.cancellation.create({
      data: {
        athleteId: athleteProfileId,
        trainingSessionId,
        reason,
      },
    });
  },

  /**
   * Undo a cancellation
   */
  async undoCancellation(athleteProfileId: string, trainingSessionId: string) {
    const cancellation = await prisma.cancellation.findUnique({
      where: {
        athleteId_trainingSessionId: {
          athleteId: athleteProfileId,
          trainingSessionId,
        },
      },
    });

    if (!cancellation) {
      throw new Error('Absage nicht gefunden');
    }

    if (!cancellation.isActive) {
      throw new Error('Absage wurde bereits rückgängig gemacht');
    }

    return prisma.cancellation.update({
      where: { id: cancellation.id },
      data: {
        isActive: false,
        undoneAt: new Date(),
      },
    });
  },

  /**
   * Update athlete's configuration (by trainer)
   */
  async updateConfiguration(
    athleteProfileId: string,
    data: {
      youthCategory?: YouthCategory;
      competitionParticipation?: boolean;
      hasDtbId?: boolean;
    }
  ) {
    return prisma.athleteProfile.update({
      where: { id: athleteProfileId },
      data: {
        ...data,
        configuredAt: new Date(),
      },
    });
  },

  /**
   * Get attendance statistics for an athlete
   */
  async getAttendanceStats(athleteProfileId: string, daysBack = 90) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const records = await prisma.attendanceRecord.findMany({
      where: {
        athleteId: athleteProfileId,
        trainingSession: {
          date: { gte: startDate },
        },
      },
    });

    const total = records.length;
    const present = records.filter((r) => r.status === 'PRESENT').length;
    const excused = records.filter((r) => r.status === 'ABSENT_EXCUSED').length;
    const unexcused = records.filter((r) => r.status === 'ABSENT_UNEXCUSED').length;

    return {
      total,
      present,
      excused,
      unexcused,
      attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0,
    };
  },
};
