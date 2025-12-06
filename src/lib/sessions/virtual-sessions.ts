import { DayOfWeek, RecurrenceInterval } from '@prisma/client';
import {
  DAY_OF_WEEK_TO_NUMBER,
  toUTCMidnight,
  getUTCDayOfWeek,
  addUTCDays,
  compareUTCDates,
  formatUTCDate,
} from '@/lib/utils/date';

export interface VirtualSession {
  // If this is a stored session, this will be the ID
  id: string | null;
  recurringTrainingId: string;
  trainingName: string;
  date: Date;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  // From stored session if exists
  isCancelled: boolean;
  cancellationReason: string | null;
  notes: string | null;
  hasAttendance: boolean;
  // Groups from recurring training
  groups: {
    id: string;
    name: string;
    athleteCount: number;
  }[];
}

interface RecurringTrainingData {
  id: string;
  name: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  recurrence: RecurrenceInterval;
  validFrom: Date | null;
  validUntil: Date | null;
  isActive: boolean;
  trainingGroups: {
    id: string;
    name: string;
    _count?: { athletes?: number; athleteAssignments?: number };
    athleteAssignments?: { assignedAt: Date }[];
  }[];
}

interface StoredSessionData {
  id: string;
  recurringTrainingId: string | null;
  date: Date;
  dayOfWeek: DayOfWeek;
  startTime: string | null;
  endTime: string | null;
  isCancelled: boolean;
  cancellationReason: string | null;
  notes: string | null;
  _count: { attendanceRecords: number };
}

/**
 * Generate virtual sessions for a date range by combining:
 * 1. Calculated dates from recurring trainings
 * 2. Stored sessions (for those with modifications/attendance)
 */
export function generateVirtualSessions(
  recurringTrainings: RecurringTrainingData[],
  storedSessions: StoredSessionData[],
  startDate: Date,
  endDate: Date
): VirtualSession[] {
  const sessions: VirtualSession[] = [];
  
  // Normalize dates to UTC midnight for consistent comparison
  const normalizedStart = toUTCMidnight(startDate);
  const normalizedEnd = toUTCMidnight(endDate);
  
  // Create a map of stored sessions by recurringTrainingId + date
  const storedSessionMap = new Map<string, StoredSessionData>();
  for (const session of storedSessions) {
    const key = `${session.recurringTrainingId}_${formatUTCDate(session.date)}`;
    storedSessionMap.set(key, session);
  }

  for (const training of recurringTrainings) {
    if (!training.isActive) continue;
    
    // Check validity period - normalize to UTC midnight
    const effectiveStart = training.validFrom && compareUTCDates(training.validFrom, normalizedStart) > 0
      ? toUTCMidnight(training.validFrom) 
      : normalizedStart;
    const effectiveEnd = training.validUntil && compareUTCDates(training.validUntil, normalizedEnd) < 0
      ? toUTCMidnight(training.validUntil)
      : normalizedEnd;
    
    if (compareUTCDates(effectiveStart, effectiveEnd) > 0) continue;

    const targetDay = DAY_OF_WEEK_TO_NUMBER[training.dayOfWeek];
    
    // Find first occurrence of this day on or after effectiveStart
    let currentDate = new Date(effectiveStart);
    const currentDayNumber = getUTCDayOfWeek(currentDate);
    let daysToAdd = targetDay - currentDayNumber;
    if (daysToAdd < 0) daysToAdd += 7;
    currentDate = addUTCDays(currentDate, daysToAdd);

    // Generate sessions for each occurrence
    while (compareUTCDates(currentDate, effectiveEnd) <= 0) {
      const dateKey = `${training.id}_${formatUTCDate(currentDate)}`;
      const storedSession = storedSessionMap.get(dateKey);

      const virtualSession: VirtualSession = {
        id: storedSession?.id || null,
        recurringTrainingId: training.id,
        trainingName: training.name,
        date: new Date(currentDate),
        dayOfWeek: training.dayOfWeek,
        startTime: storedSession?.startTime || training.startTime,
        endTime: storedSession?.endTime || training.endTime,
        isCancelled: storedSession?.isCancelled || false,
        cancellationReason: storedSession?.cancellationReason || null,
        notes: storedSession?.notes || null,
        hasAttendance: (storedSession?._count?.attendanceRecords || 0) > 0,
        groups: training.trainingGroups.map(g => ({
          id: g.id,
          name: g.name,
          athleteCount: g._count?.athletes || g._count?.athleteAssignments || g.athleteAssignments?.length || 0,
        })),
      };

      sessions.push(virtualSession);

      // Move to next occurrence
      const increment = training.recurrence === 'BIWEEKLY' ? 14 : 7;
      currentDate = addUTCDays(currentDate, increment);
    }
  }

  // Sort by date and time
  sessions.sort((a, b) => {
    const dateCompare = a.date.getTime() - b.date.getTime();
    if (dateCompare !== 0) return dateCompare;
    return a.startTime.localeCompare(b.startTime);
  });

  return sessions;
}


/**
 * Generate a unique virtual ID for sessions that aren't stored yet
 * Format: virtual_{recurringTrainingId}_{YYYY-MM-DD}
 */
export function getVirtualSessionId(recurringTrainingId: string, date: Date): string {
  const dateStr = formatUTCDate(date);
  return `virtual_${recurringTrainingId}_${dateStr}`;
}

/**
 * Parse a virtual session ID to get the recurring training ID and date.
 * Returns the date as UTC midnight to match how dates are stored.
 */
export function parseVirtualSessionId(virtualId: string): { recurringTrainingId: string; date: Date } | null {
  if (!virtualId.startsWith('virtual_')) return null;
  
  const parts = virtualId.split('_');
  if (parts.length < 3) return null;
  
  const recurringTrainingId = parts[1];
  // The date part is after "virtual_" and the recurringTrainingId
  // Format: virtual_{id}_{YYYY-MM-DD}
  const dateStr = parts[2]; // Just the YYYY-MM-DD part
  
  // Parse as UTC date to avoid timezone issues
  const dateParts = dateStr.split('-');
  if (dateParts.length !== 3) return null;
  
  const year = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed
  const day = parseInt(dateParts[2], 10);
  
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  
  // Create UTC midnight date
  const date = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  
  return { recurringTrainingId, date };
}
