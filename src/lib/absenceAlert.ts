import { statisticsService } from './services/statisticsService';
import { sendAbsenceAlertEmail } from './email';
import { prisma } from './prisma';

const ABSENCE_THRESHOLD = parseInt(process.env.ABSENCE_ALERT_THRESHOLD || '3', 10);
const ENABLE_ALERTS = process.env.ENABLE_ABSENCE_ALERTS === 'true';

/**
 * Check for absence alerts and notify trainers
 */
export async function checkAbsenceAlerts() {
  if (!ENABLE_ALERTS) {
    console.log('[Absence alerts disabled]');
    return;
  }

  try {
    // Get athletes with consecutive absences
    const athletesWithAlerts = await statisticsService.getAthletesWithAbsenceAlerts(
      ABSENCE_THRESHOLD
    );

    if (athletesWithAlerts.length === 0) {
      console.log('No absence alerts to send');
      return;
    }

    // Get all active trainers and admins
    const trainers = await prisma.trainer.findMany({
      where: {
        isActive: true,
        role: { in: ['TRAINER', 'ADMIN'] },
      },
    });

    // Send alerts
    for (const athlete of athletesWithAlerts) {
      for (const trainer of trainers) {
        await sendAbsenceAlertEmail(
          trainer.email,
          `${athlete.firstName} ${athlete.lastName}`,
          athlete.consecutiveAbsences
        );
      }
    }

    console.log(`Sent absence alerts for ${athletesWithAlerts.length} athletes`);
  } catch (error) {
    console.error('Failed to check absence alerts:', error);
  }
}

/**
 * Get absence alert summary
 */
export async function getAbsenceAlertSummary() {
  const athletes = await statisticsService.getAthletesWithAbsenceAlerts(ABSENCE_THRESHOLD);

  return {
    count: athletes.length,
    athletes: athletes.map((a) => ({
      id: a.id,
      name: `${a.firstName} ${a.lastName}`,
      absences: a.consecutiveAbsences,
      lastAbsence: a.lastAbsenceDate,
    })),
  };
}