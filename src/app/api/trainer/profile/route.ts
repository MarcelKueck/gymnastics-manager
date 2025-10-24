import { requireTrainer } from '@/lib/api/authHelpers';
import { trainerService } from '@/lib/services/trainerService';
import { asyncHandler } from '@/lib/api/errorHandlers';
import { successResponse, messageResponse } from '@/lib/api/responseHelpers';
import { z } from 'zod';

const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
});

export const GET = asyncHandler(async (request: Request) => {
  const session = await requireTrainer();

  const trainer = await trainerService.getDetails(session.user.id);

  return successResponse(trainer);
});

export const PUT = asyncHandler(async (request: Request) => {
  const session = await requireTrainer();
  const body = await request.json();

  const validatedData = updateProfileSchema.parse(body);

  await trainerService.updateProfile(session.user.id, validatedData);

  return messageResponse('Profil erfolgreich aktualisiert');
});