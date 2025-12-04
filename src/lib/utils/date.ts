/**
 * Date utilities for consistent timezone handling.
 * 
 * The key principle: Store dates as UTC midnight (00:00:00.000Z) where the date
 * part represents the calendar date in local time (Europe/Berlin).
 * 
 * For example, a Friday training on 2025-12-05 in Berlin should be stored as:
 * 2025-12-05T00:00:00.000Z (NOT 2025-12-04T23:00:00.000Z)
 */

import { DayOfWeek } from '@prisma/client';

export const DAY_OF_WEEK_TO_NUMBER: Record<DayOfWeek, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

export const NUMBER_TO_DAY_OF_WEEK: Record<number, DayOfWeek> = {
  0: 'SUNDAY',
  1: 'MONDAY',
  2: 'TUESDAY',
  3: 'WEDNESDAY',
  4: 'THURSDAY',
  5: 'FRIDAY',
  6: 'SATURDAY',
};

/**
 * Creates a UTC date at midnight for the given year, month, day.
 * This ensures the date is stored consistently regardless of server timezone.
 */
export function createUTCDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
}

/**
 * Gets a UTC midnight date from a Date object, preserving the calendar date
 * as it would appear in local time.
 * 
 * For example, if it's 2025-12-05 01:00:00 in Berlin (which is 2025-12-05T00:00:00Z),
 * this returns 2025-12-05T00:00:00.000Z
 */
export function toUTCMidnight(date: Date): Date {
  // Get the local date components
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  
  // Create UTC date with those components
  return createUTCDate(year, month, day);
}

/**
 * Gets the day of week (0-6, Sunday-Saturday) for a UTC date,
 * treating the UTC date as if it represents the local calendar date.
 */
export function getUTCDayOfWeek(date: Date): number {
  return date.getUTCDay();
}

/**
 * Adds days to a UTC date.
 */
export function addUTCDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/**
 * Finds the next occurrence of a specific day of the week on or after the given date.
 * Both input and output are UTC midnight dates.
 */
export function findNextDayOfWeek(fromDate: Date, targetDay: DayOfWeek): Date {
  const targetDayNumber = DAY_OF_WEEK_TO_NUMBER[targetDay];
  const currentDayNumber = getUTCDayOfWeek(fromDate);
  
  let daysToAdd = targetDayNumber - currentDayNumber;
  if (daysToAdd < 0) {
    daysToAdd += 7;
  }
  
  return addUTCDays(fromDate, daysToAdd);
}

/**
 * Compares two UTC dates (ignoring time).
 * Returns negative if a < b, 0 if equal, positive if a > b.
 */
export function compareUTCDates(a: Date, b: Date): number {
  const aTime = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
  const bTime = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
  return aTime - bTime;
}

/**
 * Checks if a UTC date is before another (ignoring time).
 */
export function isUTCBefore(date: Date, compareDate: Date): boolean {
  return compareUTCDates(date, compareDate) < 0;
}

/**
 * Checks if a UTC date is after another (ignoring time).
 */
export function isUTCAfter(date: Date, compareDate: Date): boolean {
  return compareUTCDates(date, compareDate) > 0;
}

/**
 * Gets today's date as UTC midnight.
 */
export function getTodayUTC(): Date {
  return toUTCMidnight(new Date());
}

/**
 * Formats a UTC date as YYYY-MM-DD string.
 */
export function formatUTCDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Parses a YYYY-MM-DD string to a UTC midnight date.
 */
export function parseUTCDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return createUTCDate(year, month - 1, day);
}
