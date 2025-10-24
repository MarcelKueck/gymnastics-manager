import { z } from 'zod';
import { DayOfWeek, RecurrenceInterval } from '@prisma/client';

export const recurringTrainingSchema = z.object({
  name: z.string().min(3, 'Name muss mindestens 3 Zeichen lang sein'),
  dayOfWeek: z.nativeEnum(DayOfWeek, {
    errorMap: () => ({ message: 'Bitte wählen Sie einen Wochentag' }),
  }),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Ungültiges Zeitformat (HH:MM)'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Ungültiges Zeitformat (HH:MM)'),
  recurrence: z.nativeEnum(RecurrenceInterval, {
    errorMap: () => ({ message: 'Bitte wählen Sie eine Wiederholung' }),
  }),
  isActive: z.boolean().optional(),
}).refine((data) => {
  const start = data.startTime.split(':').map(Number);
  const end = data.endTime.split(':').map(Number);
  return start[0] < end[0] || (start[0] === end[0] && start[1] < end[1]);
}, {
  message: 'Endzeit muss nach Startzeit liegen',
  path: ['endTime'],
});

export const trainingGroupSchema = z.object({
  recurringTrainingId: z.string().cuid('Ungültige Training-ID'),
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein'),
  sortOrder: z.number().int().min(0).optional(),
});

export const sessionUpdateSchema = z.object({
  sessionId: z.string().cuid('Ungültige Session-ID'),
  notes: z.string().optional(),
  isCancelled: z.boolean().optional(),
  cancellationReason: z.string().optional(),
  isCompleted: z.boolean().optional(),
});

export const sessionGroupUpdateSchema = z.object({
  sessionGroupId: z.string().cuid('Ungültige Session-Gruppen-ID'),
  exercises: z.string().optional(),
  notes: z.string().optional(),
});

export const athleteAssignmentSchema = z.object({
  trainingGroupId: z.string().cuid('Ungültige Trainingsgruppen-ID'),
  athleteId: z.string().cuid('Ungültige Athleten-ID'),
});

export const trainerAssignmentSchema = z.object({
  trainingGroupId: z.string().cuid('Ungültige Trainingsgruppen-ID'),
  trainerId: z.string().cuid('Ungültige Trainer-ID'),
  isPrimary: z.boolean().optional(),
  effectiveFrom: z.string().datetime().optional(),
  effectiveUntil: z.string().datetime().optional(),
});

export const sessionAthleteReassignmentSchema = z.object({
  trainingSessionId: z.string().cuid('Ungültige Session-ID'),
  sessionGroupId: z.string().cuid('Ungültige Session-Gruppen-ID'),
  athleteId: z.string().cuid('Ungültige Athleten-ID'),
  reason: z.string().optional(),
});

export const sessionCancellationSchema = z.object({
  sessionId: z.string().cuid('Ungültige Session-ID'),
  reason: z.string().min(10, 'Grund muss mindestens 10 Zeichen lang sein'),
});

export type RecurringTrainingInput = z.infer<typeof recurringTrainingSchema>;
export type TrainingGroupInput = z.infer<typeof trainingGroupSchema>;
export type SessionUpdateInput = z.infer<typeof sessionUpdateSchema>;
export type SessionGroupUpdateInput = z.infer<typeof sessionGroupUpdateSchema>;
export type AthleteAssignmentInput = z.infer<typeof athleteAssignmentSchema>;
export type TrainerAssignmentInput = z.infer<typeof trainerAssignmentSchema>;
export type SessionAthleteReassignmentInput = z.infer<typeof sessionAthleteReassignmentSchema>;
export type SessionCancellationInput = z.infer<typeof sessionCancellationSchema>;