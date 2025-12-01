import { z } from 'zod';

export const recurringTrainingSchema = z.object({
  name: z.string().min(1, 'Name erforderlich'),
  dayOfWeek: z.enum([
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
    'SUNDAY',
  ]),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format: HH:MM'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format: HH:MM'),
  recurrence: z.enum(['ONCE', 'WEEKLY', 'BIWEEKLY', 'MONTHLY']).default('WEEKLY'),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
  groupName: z.string().optional(),
});

export const trainingGroupSchema = z.object({
  name: z.string().min(1, 'Name erforderlich'),
  sortOrder: z.number().int().min(0).optional(),
});

export const athleteAssignmentSchema = z.object({
  trainingGroupId: z.string().min(1, 'Gruppe erforderlich'),
  athleteId: z.string().min(1, 'Athlet erforderlich'),
});

export const trainerAssignmentSchema = z.object({
  trainingGroupId: z.string().min(1, 'Gruppe erforderlich'),
  trainerId: z.string().min(1, 'Trainer erforderlich'),
  isPrimary: z.boolean().default(false),
});

export const sessionNoteSchema = z.object({
  sessionId: z.string().min(1),
  notes: z.string().max(1000, 'Maximal 1000 Zeichen'),
});

export const sessionCancelSchema = z.object({
  sessionId: z.string().min(1),
  reason: z.string().min(1, 'Grund erforderlich').max(500, 'Maximal 500 Zeichen'),
});

export type RecurringTrainingInput = z.infer<typeof recurringTrainingSchema>;
export type TrainingGroupInput = z.infer<typeof trainingGroupSchema>;
export type AthleteAssignmentInput = z.infer<typeof athleteAssignmentSchema>;
export type TrainerAssignmentInput = z.infer<typeof trainerAssignmentSchema>;
