import { DayOfWeek, RecurrenceInterval } from '@prisma/client';

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
    _count: { athletes?: number; athleteAssignments?: number };
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

const DAY_TO_NUMBER: Record<DayOfWeek, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

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
  
  // Create a map of stored sessions by recurringTrainingId + date
  const storedSessionMap = new Map<string, StoredSessionData>();
  for (const session of storedSessions) {
    const key = `${session.recurringTrainingId}_${session.date.toISOString().split('T')[0]}`;
    storedSessionMap.set(key, session);
  }

  for (const training of recurringTrainings) {
    if (!training.isActive) continue;
    
    // Check validity period
    const effectiveStart = training.validFrom && training.validFrom > startDate 
      ? training.validFrom 
      : startDate;
    const effectiveEnd = training.validUntil && training.validUntil < endDate
      ? training.validUntil
      : endDate;
    
    if (effectiveStart > effectiveEnd) continue;

    const targetDay = DAY_TO_NUMBER[training.dayOfWeek];
    const currentDate = new Date(effectiveStart);
    currentDate.setHours(0, 0, 0, 0);

    // Find first occurrence of this day
    const currentDay = currentDate.getDay();
    let daysToAdd = targetDay - currentDay;
    if (daysToAdd < 0) daysToAdd += 7;
    currentDate.setDate(currentDate.getDate() + daysToAdd);

    // Generate sessions for each occurrence
    while (currentDate <= effectiveEnd) {
      const dateKey = `${training.id}_${currentDate.toISOString().split('T')[0]}`;
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
          athleteCount: g._count.athletes || g._count.athleteAssignments || 0,
        })),
      };

      sessions.push(virtualSession);

      // Move to next occurrence
      const increment = training.recurrence === 'BIWEEKLY' ? 14 : 7;
      currentDate.setDate(currentDate.getDate() + increment);
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
  const dateStr = date.toISOString().split('T')[0];
  return `virtual_${recurringTrainingId}_${dateStr}`;
}

/**
 * Parse a virtual session ID to get the recurring training ID and date
 */
export function parseVirtualSessionId(virtualId: string): { recurringTrainingId: string; date: Date } | null {
  if (!virtualId.startsWith('virtual_')) return null;
  
  const parts = virtualId.split('_');
  if (parts.length < 3) return null;
  
  const recurringTrainingId = parts[1];
  const dateStr = parts.slice(2).join('_'); // Handle IDs with underscores
  const date = new Date(dateStr);
  
  if (isNaN(date.getTime())) return null;
  
  return { recurringTrainingId, date };
}
