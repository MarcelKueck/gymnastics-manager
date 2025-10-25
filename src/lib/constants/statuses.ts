import { AttendanceStatus, Gender, YouthCategory, DayOfWeek, RecurrenceInterval } from '@prisma/client';

// Attendance Status
export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  [AttendanceStatus.PRESENT]: 'Anwesend',
  [AttendanceStatus.ABSENT_EXCUSED]: 'Entschuldigt',
  [AttendanceStatus.ABSENT_UNEXCUSED]: 'Unentschuldigt',
};

export const ATTENDANCE_STATUS_COLORS: Record<AttendanceStatus, string> = {
  [AttendanceStatus.PRESENT]: 'bg-green-100 text-green-800',
  [AttendanceStatus.ABSENT_EXCUSED]: 'bg-yellow-100 text-yellow-800',
  [AttendanceStatus.ABSENT_UNEXCUSED]: 'bg-red-100 text-red-800',
};

// Gender
export const GENDER_LABELS: Record<Gender, string> = {
  [Gender.MALE]: 'Männlich',
  [Gender.FEMALE]: 'Weiblich',
  [Gender.OTHER]: 'Divers',
};

// Youth Category
export const YOUTH_CATEGORY_LABELS: Record<YouthCategory, string> = {
  [YouthCategory.F]: 'F-Jugend',
  [YouthCategory.E]: 'E-Jugend',
  [YouthCategory.D]: 'D-Jugend',
};

export const YOUTH_CATEGORY_OPTIONS = [
  { value: YouthCategory.F, label: YOUTH_CATEGORY_LABELS[YouthCategory.F] },
  { value: YouthCategory.E, label: YOUTH_CATEGORY_LABELS[YouthCategory.E] },
  { value: YouthCategory.D, label: YOUTH_CATEGORY_LABELS[YouthCategory.D] },
];

// Day of Week
export const DAY_OF_WEEK_LABELS: Record<DayOfWeek, string> = {
  [DayOfWeek.MONDAY]: 'Montag',
  [DayOfWeek.TUESDAY]: 'Dienstag',
  [DayOfWeek.WEDNESDAY]: 'Mittwoch',
  [DayOfWeek.THURSDAY]: 'Donnerstag',
  [DayOfWeek.FRIDAY]: 'Freitag',
  [DayOfWeek.SATURDAY]: 'Samstag',
  [DayOfWeek.SUNDAY]: 'Sonntag',
};

export const DAY_OF_WEEK_OPTIONS = [
  { value: DayOfWeek.MONDAY, label: DAY_OF_WEEK_LABELS[DayOfWeek.MONDAY] },
  { value: DayOfWeek.TUESDAY, label: DAY_OF_WEEK_LABELS[DayOfWeek.TUESDAY] },
  { value: DayOfWeek.WEDNESDAY, label: DAY_OF_WEEK_LABELS[DayOfWeek.WEDNESDAY] },
  { value: DayOfWeek.THURSDAY, label: DAY_OF_WEEK_LABELS[DayOfWeek.THURSDAY] },
  { value: DayOfWeek.FRIDAY, label: DAY_OF_WEEK_LABELS[DayOfWeek.FRIDAY] },
  { value: DayOfWeek.SATURDAY, label: DAY_OF_WEEK_LABELS[DayOfWeek.SATURDAY] },
  { value: DayOfWeek.SUNDAY, label: DAY_OF_WEEK_LABELS[DayOfWeek.SUNDAY] },
];

// Recurrence Interval
export const RECURRENCE_INTERVAL_LABELS: Record<RecurrenceInterval, string> = {
  [RecurrenceInterval.ONCE]: 'Einmalig',
  [RecurrenceInterval.WEEKLY]: 'Wöchentlich',
  [RecurrenceInterval.BIWEEKLY]: 'Zweiwöchentlich',
  [RecurrenceInterval.MONTHLY]: 'Monatlich',
};

export const RECURRENCE_INTERVAL_OPTIONS = [
  { value: RecurrenceInterval.ONCE, label: RECURRENCE_INTERVAL_LABELS[RecurrenceInterval.ONCE] },
  { value: RecurrenceInterval.WEEKLY, label: RECURRENCE_INTERVAL_LABELS[RecurrenceInterval.WEEKLY] },
  { value: RecurrenceInterval.BIWEEKLY, label: RECURRENCE_INTERVAL_LABELS[RecurrenceInterval.BIWEEKLY] },
  { value: RecurrenceInterval.MONTHLY, label: RECURRENCE_INTERVAL_LABELS[RecurrenceInterval.MONTHLY] },
];

// Application Constants
export const APP_CONSTANTS = {
  MIN_CANCELLATION_REASON_LENGTH: 10,
  MAX_FILE_SIZE_MB: 10,
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024,
  ALLOWED_FILE_TYPES: ['application/pdf'],
  ABSENCE_ALERT_THRESHOLD: 3,
  SESSION_DAYS_IN_FUTURE: 90,
  PAGINATION_DEFAULT_LIMIT: 50,
  PASSWORD_MIN_LENGTH: 8,
} as const;

// Status Colors
export const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  pending: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-red-100 text-red-800',
  completed: 'bg-primary/10 text-primary',
} as const;