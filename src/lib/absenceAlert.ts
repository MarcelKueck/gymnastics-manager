// src/lib/absenceAlert.ts
import { prisma } from './prisma';
import { sendUnexcusedAbsenceAlert } from './email';

/**
 * Check if an athlete has 3+ unexcused absences and send alert if needed
 * This should be called after marking attendance
 */
export async function checkAndSendAbsenceAlert(athleteId: string): Promise<void> {
  try {
    // Get athlete data
    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        guardianEmail: true,
      },
    });

    if (!athlete) {
      console.error('Athlete not found:', athleteId);
      return;
    }

    // Count unexcused absences
    const unexcusedCount = await prisma.attendanceRecord.count({
      where: {
        athleteId,
        status: 'ABSENT_UNEXCUSED',
      },
    });

    // Only send alert if 3 or more unexcused absences
    if (unexcusedCount < 3) {
      return;
    }

    // Get dates of unexcused absences
    const unexcusedRecords = await prisma.attendanceRecord.findMany({
      where: {
        athleteId,
        status: 'ABSENT_UNEXCUSED',
      },
      include: {
        trainingSession: {
          select: {
            date: true,
          },
        },
      },
      orderBy: {
        markedAt: 'desc',
      },
    });

    const absenceDates = unexcusedRecords.map(record => 
      record.trainingSession.date.toISOString()
    );

    // Check if we've already sent an alert for this exact count
    // This prevents sending duplicate alerts
    const recentAlert = await prisma.auditLog.findFirst({
      where: {
        action: 'SEND_ABSENCE_ALERT',
        entityId: athleteId,
        performedAt: {
          // Only check alerts from the last 7 days
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    if (recentAlert) {
      console.log(`Alert already sent for ${athlete.firstName} ${athlete.lastName} (${unexcusedCount} absences)`);
      return;
    }

    // Get trainer email (assume first trainer user)
    const trainer = await prisma.trainer.findFirst({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        email: true,
      },
    });

    if (!trainer) {
      console.error('No trainer found to send alert to');
      return;
    }

    // Send the alert email
    try {
      await sendUnexcusedAbsenceAlert({
        athleteEmail: athlete.email,
        guardianEmail: athlete.guardianEmail,
        athleteName: `${athlete.firstName} ${athlete.lastName}`,
        unexcusedCount,
        absenceDates,
        sendToAthlete: true,
        trainerEmail: trainer.email,
      });
      console.log(`✅ Absence alert sent to ${athlete.firstName} ${athlete.lastName} (${unexcusedCount} absences)`);
    } catch (emailError) {
      console.error('❌ Failed to send absence alert email:', emailError);
    }

    // Log the alert
    await prisma.auditLog.create({
      data: {
        performedBy: trainer.id,
        action: 'SEND_ABSENCE_ALERT',
        entityType: 'attendance',
        entityId: athleteId,
        changes: {
          athleteName: `${athlete.firstName} ${athlete.lastName}`,
          unexcusedCount,
          absenceDates,
          trainerEmail: trainer.email,
        },
      },
    });
  } catch (error) {
    console.error('Error checking/sending absence alert:', error);
    // Don't throw error - we don't want absence check to break attendance marking
  }
}