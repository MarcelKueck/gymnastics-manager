import { z } from 'zod';

export const attendanceRecordSchema = z.object({
  athleteId: z.string().min(1, 'Athlet erforderlich'),
  status: z.enum(['PRESENT', 'ABSENT_EXCUSED', 'ABSENT_UNEXCUSED']),
  notes: z.string().max(500, 'Maximal 500 Zeichen').optional(),
});

export const bulkAttendanceSchema = z.object({
  sessionId: z.string().min(1, 'Trainingseinheit erforderlich'),
  records: z.array(attendanceRecordSchema).min(1, 'Mindestens ein Eintrag erforderlich'),
});

export const cancellationSchema = z.object({
  trainingSessionId: z.string().min(1, 'Trainingseinheit erforderlich'),
  reason: z.string().min(10, 'Begründung muss mindestens 10 Zeichen lang sein'),
});

export type AttendanceRecordInput = z.infer<typeof attendanceRecordSchema>;
export type BulkAttendanceInput = z.infer<typeof bulkAttendanceSchema>;
export type CancellationInput = z.infer<typeof cancellationSchema>;
