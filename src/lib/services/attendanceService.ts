import { attendanceRepository } from '@/lib/repositories/attendanceRepository';
import { prisma } from '@/lib/prisma';
import { AttendanceStatus } from '@prisma/client';
import { absenceAlertService } from './absenceAlertService';

export class AttendanceService {
  /**
   * Mark attendance for an athlete
   */
  async markAttendance(
    athleteId: string,
    trainingSessionId: string,
    status: AttendanceStatus,
    markedBy: string,
    notes?: string
  ) {
    // Verify session exists and is in the past
    const session = await prisma.trainingSession.findUnique({
      where: { id: trainingSessionId },
    });

    if (!session) {
      throw new Error('Trainingseinheit nicht gefunden');
    }

    if (session.date > new Date()) {
      throw new Error('Anwesenheit kann nur für vergangene Trainingseinheiten markiert werden');
    }

    return attendanceRepository.mark(athleteId, trainingSessionId, status, markedBy, notes);
  }

  /**
   * Bulk mark attendance for multiple athletes
   */
  async bulkMarkAttendance(
    records: Array<{
      athleteId: string;
      trainingSessionId: string;
      status: AttendanceStatus;
      notes?: string;
    }>,
    markedBy: string
  ) {
    // Verify all sessions are in the past
    const sessionIds = [...new Set(records.map((r) => r.trainingSessionId))];
    const sessions = await prisma.trainingSession.findMany({
      where: { id: { in: sessionIds } },
    });

    const futureSessions = sessions.filter((s) => s.date > new Date());
    if (futureSessions.length > 0) {
      throw new Error('Anwesenheit kann nur für vergangene Trainingseinheiten markiert werden');
    }

    const result = await attendanceRepository.bulkMark(records, markedBy);

    // Check for absence alerts for athletes marked as ABSENT_UNEXCUSED
    const unexcusedRecords = records.filter((r) => r.status === AttendanceStatus.ABSENT_UNEXCUSED);
    for (const record of unexcusedRecords) {
      try {
        await absenceAlertService.checkAndSendAbsenceAlert(record.athleteId);
      } catch (error) {
        console.error('Failed to check absence alert:', error);
      }
    }

    return result;
  }

  /**
   * Update attendance record
   */
  async updateAttendance(
    attendanceRecordId: string,
    status: AttendanceStatus,
    modifiedBy: string,
    modificationReason: string,
    notes?: string
  ) {
    const record = await attendanceRepository.findById(attendanceRecordId);
    if (!record) {
      throw new Error('Anwesenheitseintrag nicht gefunden');
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: 'attendance',
        entityId: attendanceRecordId,
        action: 'update',
        performedBy: modifiedBy,
        changes: {
          oldStatus: record.status,
          newStatus: status,
          oldNotes: record.notes,
          newNotes: notes,
        },
        reason: modificationReason,
      },
    });

    return attendanceRepository.update(
      attendanceRecordId,
      status,
      modifiedBy,
      modificationReason,
      notes
    );
  }

  /**
   * Create cancellation
   */
  async createCancellation(athleteId: string, trainingSessionId: string, reason: string) {
    // Verify session exists and is in the future
    const session = await prisma.trainingSession.findUnique({
      where: { id: trainingSessionId },
    });

    if (!session) {
      throw new Error('Trainingseinheit nicht gefunden');
    }

    if (session.date < new Date()) {
      throw new Error('Absage nur für zukünftige Trainingseinheiten möglich');
    }

    // Check if already cancelled
    const existing = await prisma.cancellation.findFirst({
      where: {
        athleteId,
        trainingSessionId,
        isActive: true,
      },
    });

    if (existing) {
      throw new Error('Diese Trainingseinheit wurde bereits abgesagt');
    }

    return attendanceRepository.createCancellation(athleteId, trainingSessionId, reason);
  }

  /**
   * Undo cancellation
   */
  async undoCancellation(cancellationId: string) {
    const cancellation = await attendanceRepository.findCancellationById(cancellationId);
    if (!cancellation) {
      throw new Error('Absage nicht gefunden');
    }

    if (!cancellation.isActive) {
      throw new Error('Diese Absage wurde bereits rückgängig gemacht');
    }

    if (cancellation.trainingSession.date < new Date()) {
      throw new Error('Absage für vergangene Trainingseinheiten kann nicht rückgängig gemacht werden');
    }

    return attendanceRepository.undoCancellation(cancellationId);
  }

  /**
   * Get attendance for a session
   */
  async getSessionAttendance(sessionId: string) {
    return attendanceRepository.findBySession(sessionId);
  }

  /**
   * Get attendance for an athlete
   */
  async getAthleteAttendance(athleteId: string, dateFrom?: Date, dateTo?: Date) {
    return attendanceRepository.findByAthlete(athleteId, dateFrom, dateTo);
  }

  /**
   * Get active cancellations for athlete
   */
  async getActiveCancellations(athleteId: string) {
    return attendanceRepository.findActiveCancellations(athleteId);
  }

  /**
   * Get athletes with consecutive absences (for alerts)
   */
  async getAthletesWithAbsenceAlerts(threshold: number = 3) {
    return attendanceRepository.findAthletesWithConsecutiveAbsences(threshold);
  }

  /**
   * Get attendance statistics for athlete
   */
  async getAthleteStatistics(athleteId: string, dateFrom?: Date, dateTo?: Date) {
    const [present, excused, unexcused] = await Promise.all([
      attendanceRepository.countByStatus(athleteId, AttendanceStatus.PRESENT, dateFrom, dateTo),
      attendanceRepository.countByStatus(athleteId, AttendanceStatus.ABSENT_EXCUSED, dateFrom, dateTo),
      attendanceRepository.countByStatus(athleteId, AttendanceStatus.ABSENT_UNEXCUSED, dateFrom, dateTo),
    ]);

    const total = present + excused + unexcused;

    return {
      totalSessions: total,
      present,
      excused,
      unexcused,
      attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0,
    };
  }
}

export const attendanceService = new AttendanceService();