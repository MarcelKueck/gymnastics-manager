import { z } from 'zod';
import { AttendanceStatus } from '@prisma/client';

export const cancellationSchema = z.object({
  trainingSessionId: z.string().cuid('Ungültige Session-ID'),
  reason: z.string().min(10, 'Grund muss mindestens 10 Zeichen lang sein'),
});

export const cancellationUndoSchema = z.object({
  cancellationId: z.string().cuid('Ungültige Absage-ID'),
});

export const attendanceMarkSchema = z.object({
  trainingSessionId: z.string().cuid('Ungültige Session-ID'),
  athleteId: z.string().cuid('Ungültige Athleten-ID'),
  status: z.nativeEnum(AttendanceStatus, {
    errorMap: () => ({ message: 'Ungültiger Anwesenheitsstatus' }),
  }),
  notes: z.string().optional(),
});

export const attendanceUpdateSchema = z.object({
  attendanceRecordId: z.string().cuid('Ungültige Anwesenheits-ID'),
  status: z.nativeEnum(AttendanceStatus, {
    errorMap: () => ({ message: 'Ungültiger Anwesenheitsstatus' }),
  }),
  notes: z.string().optional(),
  modificationReason: z.string().min(10, 'Grund für Änderung muss mindestens 10 Zeichen lang sein'),
});

export const bulkAttendanceMarkSchema = z.object({
  trainingSessionId: z.string().cuid('Ungültige Session-ID'),
  records: z.array(
    z.object({
      athleteId: z.string().cuid('Ungültige Athleten-ID'),
      status: z.nativeEnum(AttendanceStatus),
      notes: z.string().optional(),
    })
  ).min(1, 'Mindestens ein Eintrag erforderlich'),
});

export const attendanceSearchSchema = z.object({
  athleteId: z.string().cuid().optional(),
  trainingSessionId: z.string().cuid().optional(),
  status: z.nativeEnum(AttendanceStatus).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
});

export type CancellationInput = z.infer<typeof cancellationSchema>;
export type CancellationUndoInput = z.infer<typeof cancellationUndoSchema>;
export type AttendanceMarkInput = z.infer<typeof attendanceMarkSchema>;
export type AttendanceUpdateInput = z.infer<typeof attendanceUpdateSchema>;
export type BulkAttendanceMarkInput = z.infer<typeof bulkAttendanceMarkSchema>;
export type AttendanceSearchInput = z.infer<typeof attendanceSearchSchema>;