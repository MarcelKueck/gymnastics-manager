import { sessionRepository } from '@/lib/repositories/sessionRepository';
import { prisma } from '@/lib/prisma';

export class SessionService {
  /**
   * Get session details with all related data
   */
  async getSessionDetails(sessionId: string) {
    return sessionRepository.findById(sessionId, {
      recurringTraining: true,
      groups: {
        include: {
          trainingGroup: true,
          trainerAssignments: {
            include: {
              trainer: true,
            },
          },
          sessionAthleteAssignments: {
            include: {
              athlete: true,
            },
          },
        },
      },
      cancellations: {
        where: { isActive: true },
        include: {
          athlete: true,
        },
      },
      attendanceRecords: {
        include: {
          athlete: true,
          markedByTrainer: true,
        },
      },
    });
  }

  /**
   * Get upcoming sessions
   */
  async getUpcomingSessions(limit: number = 10) {
    return sessionRepository.findUpcoming(limit);
  }

  /**
   * Get sessions for date range
   */
  async getSessionsInRange(startDate: Date, endDate: Date) {
    return sessionRepository.findByDateRange(startDate, endDate);
  }

  /**
   * Get sessions for an athlete
   */
  async getAthletesSessions(athleteId: string, dateFrom?: Date, dateTo?: Date) {
    return sessionRepository.findByAthlete(athleteId, dateFrom, dateTo);
  }

  /**
   * Get sessions for a trainer
   */
  async getTrainersSessions(trainerId: string, dateFrom?: Date, dateTo?: Date) {
    return sessionRepository.findByTrainer(trainerId, dateFrom, dateTo);
  }

  /**
   * Update session notes
   */
  async updateSessionNotes(sessionId: string, notes: string) {
    return sessionRepository.update(sessionId, { notes });
  }

  /**
   * Update session group exercises and notes
   */
  async updateSessionGroup(sessionGroupId: string, exercises?: string, notes?: string) {
    return sessionRepository.updateSessionGroup(sessionGroupId, {
      ...(exercises !== undefined && { exercises }),
      ...(notes !== undefined && { notes }),
    });
  }

  /**
   * Copy exercises from previous week
   */
  async copyExercisesFromPreviousWeek(sessionGroupId: string) {
    const sessionGroup = await prisma.sessionGroup.findUnique({
      where: { id: sessionGroupId },
      include: {
        trainingSession: true,
        trainingGroup: true,
      },
    });

    if (!sessionGroup) {
      throw new Error('Session-Gruppe nicht gefunden');
    }

    // Find previous session for the same training group (7 days ago)
    const previousDate = new Date(sessionGroup.trainingSession.date);
    previousDate.setDate(previousDate.getDate() - 7);

    const previousSession = await prisma.trainingSession.findFirst({
      where: {
        date: previousDate,
        recurringTrainingId: sessionGroup.trainingSession.recurringTrainingId,
      },
      include: {
        groups: {
          where: {
            trainingGroupId: sessionGroup.trainingGroupId,
          },
        },
      },
    });

    if (!previousSession || !previousSession.groups[0]) {
      throw new Error('Keine vorherige Trainingseinheit gefunden');
    }

    const previousSessionGroup = previousSession.groups[0];

    // Copy exercises
    return sessionRepository.updateSessionGroup(sessionGroupId, {
      exercises: previousSessionGroup.exercises || '',
    });
  }

  /**
   * Cancel session
   */
  async cancelSession(sessionId: string, cancelledBy: string, reason: string) {
    return sessionRepository.cancel(sessionId, cancelledBy, reason);
  }

  /**
   * Mark session as completed
   */
  async markSessionCompleted(sessionId: string) {
    return sessionRepository.markCompleted(sessionId);
  }

  /**
   * Reassign athlete to different group for a session
   */
  async reassignAthlete(
    sessionId: string,
    athleteId: string,
    newSessionGroupId: string,
    movedBy: string,
    reason?: string
  ) {
    return sessionRepository.reassignAthlete(
      sessionId,
      newSessionGroupId,
      athleteId,
      movedBy,
      reason
    );
  }

  /**
   * Get athletes for a session organized by groups
   */
  async getSessionAthletesByGroup(sessionId: string) {
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
          orderBy: {
            trainingGroup: {
              sortOrder: 'asc',
            },
          },
        },
        sessionAthleteAssignments: {
          include: {
            athlete: true,
            sessionGroup: true,
          },
        },
        cancellations: {
          where: { isActive: true },
        },
        attendanceRecords: true,
      },
    });

    if (!session) {
      throw new Error('Trainingseinheit nicht gefunden');
    }

    // Organize athletes by session group
    const athletesByGroup = new Map<
      string,
      Array<{
        athlete: any;
        isCancelled: boolean;
        attendance: any;
        isReassigned: boolean;
      }>
    >();

    // Initialize groups
    session.groups.forEach((sessionGroup) => {
      athletesByGroup.set(sessionGroup.id, []);
    });

    // Add athletes from recurring assignments
    session.groups.forEach((sessionGroup) => {
      sessionGroup.trainingGroup.athleteAssignments.forEach((assignment) => {
        const athlete = assignment.athlete;
        const cancellation = session.cancellations.find(
          (c) => c.athleteId === athlete.id && c.isActive
        );
        const attendance = session.attendanceRecords.find(
          (a) => a.athleteId === athlete.id
        );

        // Check if reassigned
        const reassignment = session.sessionAthleteAssignments.find(
          (sa) => sa.athleteId === athlete.id
        );

        if (!reassignment) {
          athletesByGroup.get(sessionGroup.id)?.push({
            athlete,
            isCancelled: !!cancellation,
            attendance,
            isReassigned: false,
          });
        }
      });
    });

    // Add/override with session-specific reassignments
    session.sessionAthleteAssignments.forEach((assignment) => {
      const cancellation = session.cancellations.find(
        (c) => c.athleteId === assignment.athleteId && c.isActive
      );
      const attendance = session.attendanceRecords.find(
        (a) => a.athleteId === assignment.athleteId
      );

      athletesByGroup.get(assignment.sessionGroupId)?.push({
        athlete: assignment.athlete,
        isCancelled: !!cancellation,
        attendance,
        isReassigned: true,
      });
    });

    // Convert to array format
    return session.groups.map((sessionGroup) => ({
      sessionGroup,
      athletes: athletesByGroup.get(sessionGroup.id) || [],
    }));
  }
}

export const sessionService = new SessionService();