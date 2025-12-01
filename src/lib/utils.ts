import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, formatStr = "dd.MM.yyyy") {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, formatStr, { locale: de });
}

export function formatTime(time: string) {
  return time; // Already HH:MM format
}

export function formatDateTime(date: Date | string) {
  return formatDate(date, "dd.MM.yyyy HH:mm");
}

export function formatDateLong(date: Date | string) {
  return formatDate(date, "EEEE, dd. MMMM yyyy");
}

export function formatWeekday(date: Date | string) {
  return formatDate(date, "EEEE");
}
