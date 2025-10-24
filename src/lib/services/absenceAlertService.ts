import { prisma } from '@/lib/prisma';
import { AttendanceStatus } from '@prisma/client';
import { settingsService } from './settingsService';
import { sendEnhancedAbsenceAlertEmail } from '@/lib/email';

export class AbsenceAlertService {
  /**
   * Check if athlete has exceeded absence threshold and send alert if needed
   */
  async checkAndSendAbsenceAlert(athleteId: string) {
    const settings = await settingsService.getAbsenceAlertSettings();

    if (!settings.enabled) {
      return null;
    }

    // Calculate date range for checking absences
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - settings.windowDays);

    // Get unexcused absences without prior cancellation
    const sessions = await prisma.trainingSession.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
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
        attendanceRecords: {
          where: { athleteId },
        },
        cancellations: {
          where: {
            athleteId,
            isActive: true,
          },
        },
      },
    });

    // Count sessions where athlete:
    // 1. Was marked as ABSENT_UNEXCUSED, OR
    // 2. Didn't cancel and didn't show up (no cancellation, no attendance record for past sessions)
    const now = new Date();
    const forgottenCancellations = sessions.filter((session) => {
      const isPast = session.date < now;
      const hasCancellation = session.cancellations.length > 0;
      const hasAttendance = session.attendanceRecords.length > 0;

      if (!isPast) return false;

      // If marked as unexcused absence
      if (hasAttendance && session.attendanceRecords[0].status === AttendanceStatus.ABSENT_UNEXCUSED) {
        return true;
      }

      // If session is past and no cancellation and no attendance record
      if (!hasCancellation && !hasAttendance) {
        return true;
      }

      return false;
    });

    const absenceCount = forgottenCancellations.length;

    // Check if threshold is exceeded
    if (absenceCount < settings.threshold) {
      return null;
    }

    // Check if alert was already sent within cooldown period
    const cooldownDate = new Date();
    cooldownDate.setDate(cooldownDate.getDate() - settings.cooldownDays);

    const recentAlert = await prisma.absenceAlert.findFirst({
      where: {
        athleteId,
        sentAt: {
          gte: cooldownDate,
        },
      },
      orderBy: {
        sentAt: 'desc',
      },
    });

    if (recentAlert) {
      return null; // Alert already sent within cooldown period
    }

    // Get athlete info
    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
    });

    if (!athlete) {
      throw new Error('Athlete not found');
    }

    // Create alert record
    const alert = await prisma.absenceAlert.create({
      data: {
        athleteId,
        absenceCount,
        absencePeriodStart: startDate,
        absencePeriodEnd: endDate,
        emailSentToAthlete: false,
        emailSentToAdmin: false,
      },
    });

    // Send emails
    try {
      await sendEnhancedAbsenceAlertEmail({
        athleteName: `${athlete.firstName} ${athlete.lastName}`,
        athleteEmail: athlete.email,
        adminEmail: settings.adminEmail,
        absenceCount,
        periodDays: settings.windowDays,
        sessions: forgottenCancellations.map((s) => ({
          date: s.date,
          name: s.recurringTraining?.name || 'Training',
        })),
      });

      // Update alert as sent
      await prisma.absenceAlert.update({
        where: { id: alert.id },
        data: {
          emailSentToAthlete: true,
          emailSentToAdmin: true,
        },
      });

      return alert;
    } catch (error) {
      console.error('Failed to send absence alert emails:', error);
      return alert;
    }
  }

  /**
   * Get absence alerts for an athlete
   */
  async getAthleteAlerts(athleteId: string, limit: number = 10) {
    return prisma.absenceAlert.findMany({
      where: { athleteId },
      orderBy: { sentAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get all recent absence alerts (admin view)
   */
  async getAllRecentAlerts(days: number = 30, limit: number = 50) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return prisma.absenceAlert.findMany({
      where: {
        sentAt: {
          gte: startDate,
        },
      },
      include: {
        athlete: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { sentAt: 'desc' },
      take: limit,
    });
  }
}

export const absenceAlertService = new AbsenceAlertService();
