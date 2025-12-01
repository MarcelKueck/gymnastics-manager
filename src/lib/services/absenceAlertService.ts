import { prisma } from '@/lib/prisma';
import { sendAbsenceAlert, getAdminEmails } from '@/lib/email';

export interface AbsenceAlertConfig {
  threshold: number;          // Number of absences to trigger alert
  windowDays: number;         // Days to look back for absences
  cooldownDays: number;       // Days before sending another alert for same athlete
  isEnabled: boolean;         // Whether alerts are enabled
}

/**
 * Get the current absence alert configuration from system settings
 */
export async function getAbsenceAlertConfig(): Promise<AbsenceAlertConfig> {
  const settings = await prisma.systemSettings.findUnique({
    where: { id: 'default' },
  });

  return {
    threshold: settings?.absenceAlertThreshold ?? 3,
    windowDays: settings?.absenceAlertWindowDays ?? 30,
    cooldownDays: settings?.absenceAlertCooldownDays ?? 14,
    isEnabled: settings?.absenceAlertEnabled ?? true,
  };
}

/**
 * Count unexcused absences for an athlete within the specified window
 */
export async function countUnexcusedAbsences(
  athleteId: string,
  windowDays: number
): Promise<number> {
  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - windowDays);

  const count = await prisma.attendanceRecord.count({
    where: {
      athleteId,
      status: 'ABSENT_UNEXCUSED',
      markedAt: { gte: windowStart },
    },
  });

  return count;
}

/**
 * Check if an alert was recently sent for this athlete (within cooldown period)
 */
export async function isWithinCooldown(
  athleteId: string,
  cooldownDays: number
): Promise<boolean> {
  const cooldownStart = new Date();
  cooldownStart.setDate(cooldownStart.getDate() - cooldownDays);

  const recentAlert = await prisma.absenceAlert.findFirst({
    where: {
      athleteId,
      createdAt: { gte: cooldownStart },
    },
    orderBy: { createdAt: 'desc' },
  });

  return !!recentAlert;
}

/**
 * Create an absence alert record
 */
export async function createAbsenceAlert(
  athleteId: string,
  absenceCount: number,
  windowDays: number
) {
  return prisma.absenceAlert.create({
    data: {
      athleteId,
      absenceCount,
      period: windowDays,
    },
  });
}

/**
 * Check and potentially trigger an absence alert for an athlete
 * Called after attendance is marked
 */
export async function checkAndTriggerAbsenceAlert(athleteId: string): Promise<{
  triggered: boolean;
  reason?: string;
}> {
  try {
    const config = await getAbsenceAlertConfig();

    // Check if alerts are enabled
    if (!config.isEnabled) {
      return { triggered: false, reason: 'Alerts disabled' };
    }

    // Check if we have any admins to notify
    const adminEmails = await getAdminEmails();
    if (adminEmails.length === 0) {
      return { triggered: false, reason: 'No admins configured' };
    }

    // Check cooldown period
    const inCooldown = await isWithinCooldown(athleteId, config.cooldownDays);
    if (inCooldown) {
      return { triggered: false, reason: 'Within cooldown period' };
    }

    // Count unexcused absences
    const absenceCount = await countUnexcusedAbsences(athleteId, config.windowDays);
    if (absenceCount < config.threshold) {
      return { triggered: false, reason: 'Below threshold' };
    }

    // Get athlete info for the email
    const athlete = await prisma.athleteProfile.findUnique({
      where: { id: athleteId },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!athlete) {
      return { triggered: false, reason: 'Athlete not found' };
    }

    // Create the alert record
    await createAbsenceAlert(athleteId, absenceCount, config.windowDays);

    // Send the notification email to all admins
    await sendAbsenceAlert(
      {
        firstName: athlete.user.firstName,
        lastName: athlete.user.lastName,
      },
      absenceCount,
      config.windowDays
    );

    console.log(
      `[AbsenceAlert] Alert triggered for athlete ${athlete.user.firstName} ${athlete.user.lastName} (${absenceCount} absences)`
    );

    return { triggered: true };
  } catch (error) {
    console.error('[AbsenceAlert] Error checking/triggering alert:', error);
    return { triggered: false, reason: 'Error occurred' };
  }
}

/**
 * Acknowledge an absence alert (mark it as reviewed)
 */
export async function acknowledgeAlert(
  alertId: string,
  acknowledgedBy: string
): Promise<void> {
  await prisma.absenceAlert.update({
    where: { id: alertId },
    data: {
      acknowledged: true,
      acknowledgedAt: new Date(),
      acknowledgedBy,
    },
  });
}

/**
 * Get unacknowledged alerts for the trainer dashboard
 */
export async function getUnacknowledgedAlerts() {
  return prisma.absenceAlert.findMany({
    where: { acknowledged: false },
    include: {
      athlete: {
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get all alerts for an athlete
 */
export async function getAlertsForAthlete(athleteId: string) {
  return prisma.absenceAlert.findMany({
    where: { athleteId },
    include: {
      acknowledgedByUser: {
        include: {
          user: {
            select: { firstName: true, lastName: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}
