import { requireAdmin } from '@/lib/api/authHelpers';
import { trainerService } from '@/lib/services/trainerService';
import { asyncHandler } from '@/lib/api/errorHandlers';
import { successResponse, messageResponse } from '@/lib/api/responseHelpers';
import { z } from 'zod';
import { UserRole } from '@prisma/client';

const createTrainerSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen lang sein'),
  firstName: z.string().min(1, 'Vorname erforderlich'),
  lastName: z.string().min(1, 'Nachname erforderlich'),
  phone: z.string().min(1, 'Telefonnummer erforderlich'),
  role: z.nativeEnum(UserRole).optional(),
});

export const GET = asyncHandler(async (request: Request) => {
  await requireAdmin();
  const { searchParams } = new URL(request.url);

  const activeOnly = searchParams.get('activeOnly') !== 'false';

  const trainers = await trainerService.getAll(activeOnly);

  return successResponse(trainers);
});

export const POST = asyncHandler(async (request: Request) => {
  await requireAdmin();
  const body = await request.json();

  const validatedData = createTrainerSchema.parse(body);

  const trainer = await trainerService.create(validatedData);

  return successResponse(trainer, 201);
});