// Day of week labels (German)
export const DAY_OF_WEEK_LABELS = {
  MONDAY: "Montag",
  TUESDAY: "Dienstag",
  WEDNESDAY: "Mittwoch",
  THURSDAY: "Donnerstag",
  FRIDAY: "Freitag",
  SATURDAY: "Samstag",
  SUNDAY: "Sonntag",
} as const;

// Youth category labels (German Gymnastics Federation)
export const YOUTH_CATEGORY_LABELS = {
  F: "F-Jugend",
  E: "E-Jugend",
  D: "D-Jugend",
} as const;

// Attendance status labels (German)
export const ATTENDANCE_STATUS_LABELS = {
  PRESENT: "Anwesend",
  ABSENT_UNEXCUSED: "Unentschuldigt abwesend",
  ABSENT_EXCUSED: "Entschuldigt abwesend",
} as const;

// Gender labels (German)
export const GENDER_LABELS = {
  MALE: "Männlich",
  FEMALE: "Weiblich",
  OTHER: "Divers",
} as const;

// User role labels (German)
export const USER_ROLE_LABELS = {
  ATHLETE: "Athlet",
  TRAINER: "Trainer",
  ADMIN: "Administrator",
} as const;

// Recurrence interval labels (German)
export const RECURRENCE_LABELS = {
  ONCE: "Einmalig",
  WEEKLY: "Wöchentlich",
  BIWEEKLY: "Zweiwöchentlich",
  MONTHLY: "Monatlich",
} as const;

// Session status labels (German)
export const SESSION_STATUS = {
  UPCOMING: "Anstehend",
  COMPLETED: "Abgeschlossen",
  CANCELLED: "Abgesagt",
} as const;

// Common action labels (German)
export const ACTION_LABELS = {
  SAVE: "Speichern",
  CANCEL: "Abbrechen",
  DELETE: "Löschen",
  EDIT: "Bearbeiten",
  CREATE: "Erstellen",
  BACK: "Zurück",
  CLOSE: "Schließen",
  CONFIRM: "Bestätigen",
  LOADING: "Wird geladen...",
  SUBMIT: "Absenden",
  SEARCH: "Suchen",
} as const;

// Common messages (German)
export const MESSAGES = {
  SUCCESS: {
    SAVE: "Erfolgreich gespeichert",
    DELETE: "Erfolgreich gelöscht",
    CREATE: "Erfolgreich erstellt",
    UPDATE: "Erfolgreich aktualisiert",
  },
  ERROR: {
    GENERAL: "Ein Fehler ist aufgetreten",
    NOT_FOUND: "Nicht gefunden",
    UNAUTHORIZED: "Nicht autorisiert",
    FORBIDDEN: "Zugriff verweigert",
    VALIDATION: "Ungültige Eingabe",
  },
  CONFIRM: {
    DELETE: "Möchten Sie diesen Eintrag wirklich löschen?",
    CANCEL: "Möchten Sie wirklich abbrechen? Ungespeicherte Änderungen gehen verloren.",
  },
} as const;

// Form validation messages (German)
export const VALIDATION_MESSAGES = {
  REQUIRED: "Dieses Feld ist erforderlich",
  EMAIL_INVALID: "Ungültige E-Mail-Adresse",
  PASSWORD_MIN: "Passwort muss mindestens 8 Zeichen lang sein",
  PASSWORD_MISMATCH: "Passwörter stimmen nicht überein",
  MIN_LENGTH: (min: number) => `Mindestens ${min} Zeichen erforderlich`,
  MAX_LENGTH: (max: number) => `Maximal ${max} Zeichen erlaubt`,
  PHONE_INVALID: "Ungültige Telefonnummer",
  DATE_INVALID: "Ungültiges Datum",
  TIME_INVALID: "Ungültige Uhrzeit",
} as const;

// Navigation labels (German)
export const NAV_LABELS = {
  DASHBOARD: "Dashboard",
  SCHEDULE: "Trainingsplan",
  CANCELLATIONS: "Absagen",
  PROFILE: "Profil",
  COMPETITIONS: "Wettkämpfe",
  FILES: "Dateien",
  HISTORY: "Verlauf",
  ATHLETES: "Athleten",
  SESSIONS: "Trainingseinheiten",
  STATISTICS: "Statistiken",
  SETTINGS: "Einstellungen",
  ADMIN: "Administration",
  TRAININGS: "Trainings",
  USERS: "Benutzer",
  HOURS: "Trainerstunden",
} as const;
