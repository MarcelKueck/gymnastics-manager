import { z } from 'zod';
import { Gender, YouthCategory } from '@prisma/client';

export const loginSchema = z.object({
  email: z.string().email('Bitte geben Sie eine gültige E-Mail-Adresse ein'),
  password: z.string().min(1, 'Passwort ist erforderlich'),
});

export const athleteRegistrationSchema = z.object({
  // Personal Information
  firstName: z.string().min(2, 'Vorname muss mindestens 2 Zeichen lang sein'),
  lastName: z.string().min(2, 'Nachname muss mindestens 2 Zeichen lang sein'),
  email: z.string().email('Bitte geben Sie eine gültige E-Mail-Adresse ein'),
  password: z
    .string()
    .min(8, 'Passwort muss mindestens 8 Zeichen lang sein')
    .regex(/[A-Z]/, 'Passwort muss mindestens einen Großbuchstaben enthalten')
    .regex(/[a-z]/, 'Passwort muss mindestens einen Kleinbuchstaben enthalten')
    .regex(/[0-9]/, 'Passwort muss mindestens eine Ziffer enthalten'),
  confirmPassword: z.string(),
  birthDate: z.string().refine((date) => {
    const birthDate = new Date(date);
    const today = new Date();
    // Ensure the date is valid and not in the future
    return birthDate <= today && !isNaN(birthDate.getTime());
  }, 'Bitte geben Sie ein gültiges Geburtsdatum ein'),
  gender: z.nativeEnum(Gender, { errorMap: () => ({ message: 'Bitte wählen Sie ein Geschlecht' }) }),
  phone: z.string().min(10, 'Bitte geben Sie eine gültige Telefonnummer ein'),

  // Guardian Information (optional, but validated if provided)
  guardianName: z.string().optional(),
  guardianEmail: z.string().email('Bitte geben Sie eine gültige E-Mail-Adresse ein').optional().or(z.literal('')),
  guardianPhone: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwörter stimmen nicht überein',
  path: ['confirmPassword'],
});

export const trainerRegistrationSchema = z.object({
  firstName: z.string().min(2, 'Vorname muss mindestens 2 Zeichen lang sein'),
  lastName: z.string().min(2, 'Nachname muss mindestens 2 Zeichen lang sein'),
  email: z.string().email('Bitte geben Sie eine gültige E-Mail-Adresse ein'),
  password: z
    .string()
    .min(8, 'Passwort muss mindestens 8 Zeichen lang sein')
    .regex(/[A-Z]/, 'Passwort muss mindestens einen Großbuchstaben enthalten')
    .regex(/[a-z]/, 'Passwort muss mindestens einen Kleinbuchstaben enthalten')
    .regex(/[0-9]/, 'Passwort muss mindestens eine Ziffer enthalten'),
  confirmPassword: z.string(),
  phone: z.string().min(10, 'Bitte geben Sie eine gültige Telefonnummer ein'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwörter stimmen nicht überein',
  path: ['confirmPassword'],
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Aktuelles Passwort ist erforderlich'),
  newPassword: z
    .string()
    .min(8, 'Neues Passwort muss mindestens 8 Zeichen lang sein')
    .regex(/[A-Z]/, 'Passwort muss mindestens einen Großbuchstaben enthalten')
    .regex(/[a-z]/, 'Passwort muss mindestens einen Kleinbuchstaben enthalten')
    .regex(/[0-9]/, 'Passwort muss mindestens eine Ziffer enthalten'),
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'Passwörter stimmen nicht überein',
  path: ['confirmNewPassword'],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type AthleteRegistrationInput = z.infer<typeof athleteRegistrationSchema>;
export type TrainerRegistrationInput = z.infer<typeof trainerRegistrationSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;