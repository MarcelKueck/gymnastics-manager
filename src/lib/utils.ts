// Save as: src/lib/utils.ts

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Youth category calculation based on birth year
export function calculateYouthCategory(birthDate: Date): "F" | "E" | "D" {
  const currentYear = new Date().getFullYear();
  const birthYear = birthDate.getFullYear();
  const age = currentYear - birthYear;

  if (age <= 8) return "F";
  if (age <= 10) return "E";
  return "D";
}

// Format date for display
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

// Format time for display (1. Stunde / 2. Stunde)
export function formatHour(hour: number): string {
  return `${hour}. Stunde`;
}

// Check if cancellation is allowed (2 hours before session)
export function canCancelSession(sessionDate: Date): boolean {
  const now = new Date();
  const hoursBeforeSession = (sessionDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  const minHours = parseInt(process.env.NEXT_PUBLIC_MIN_CANCELLATION_HOURS || "2");
  return hoursBeforeSession >= minHours && sessionDate > now;
}