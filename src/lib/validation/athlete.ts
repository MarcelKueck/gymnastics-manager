import { z } from 'zod';
import { Gender, YouthCategory } from '@prisma/client';

export const athleteProfileUpdateSchema = z.object({
  firstName: z.string().min(2, 'Vorname muss mindestens 2 Zeichen lang sein'),
  lastName: z.string().min(2, 'Nachname muss mindestens 2 Zeichen lang sein'),
  phone: z.string().min(10, 'Bitte geben Sie eine gültige Telefonnummer ein'),
  guardianName: z.string().optional(),
  guardianEmail: z.string().email('Bitte geben Sie eine gültige E-Mail-Adresse ein').optional().or(z.literal('')),
  guardianPhone: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  autoConfirmFutureSessions: z.boolean().optional(),
});

export const athleteConfigurationSchema = z.object({
  athleteId: z.string().cuid('Ungültige Athleten-ID'),
  youthCategory: z.nativeEnum(YouthCategory, {
    errorMap: () => ({ message: 'Bitte wählen Sie eine Jugendkategorie' }),
  }),
  competitionParticipation: z.boolean(),
  hasDtbId: z.boolean(),
  trainingGroupIds: z.array(z.string().cuid()).min(1, 'Mindestens eine Trainingsgruppe muss ausgewählt werden'),
});

export const athleteApprovalSchema = z.object({
  athleteId: z.string().cuid('Ungültige Athleten-ID'),
  youthCategory: z.nativeEnum(YouthCategory),
  competitionParticipation: z.boolean(),
  hasDtbId: z.boolean(),
  trainingGroupIds: z.array(z.string().cuid()).min(1, 'Mindestens eine Trainingsgruppe muss ausgewählt werden'),
});

export const athleteSearchSchema = z.object({
  query: z.string().optional(),
  status: z.enum(['all', 'approved', 'pending']).optional(),
  youthCategory: z.nativeEnum(YouthCategory).optional(),
  competitionOnly: z.boolean().optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
});

export type AthleteProfileUpdateInput = z.infer<typeof athleteProfileUpdateSchema>;
export type AthleteConfigurationInput = z.infer<typeof athleteConfigurationSchema>;
export type AthleteApprovalInput = z.infer<typeof athleteApprovalSchema>;
export type AthleteSearchInput = z.infer<typeof athleteSearchSchema>;