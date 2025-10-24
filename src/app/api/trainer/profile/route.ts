import { requireTrainer } from '@/lib/api/authHelpers';
import { trainerService } from '@/lib/services/trainerService';
import { asyncHandler } from '@/lib/api/errorHandlers';
import { successResponse, messageResponse } from '@/lib/api/responseHelpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
});

export const GET = asyncHandler(async (request: Request) => {
  const session = await requireTrainer();

  let trainerProfileId = session.user.trainerProfileId;

  // Fallback: if trainerProfileId is not in session, query it from the database
  if (!trainerProfileId) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { trainerProfile: true },
    });
    
    if (!user) {
      throw new Error('Benutzer nicht gefunden. Bitte melden Sie sich erneut an.');
    }
    
    if (!user.trainerProfile) {
      throw new Error('Trainer-Profil nicht gefunden. Bitte melden Sie sich erneut an.');
    }
    
    trainerProfileId = user.trainerProfile.id;
  }

  const trainerProfile = await trainerService.getDetails(trainerProfileId);

  if (!trainerProfile) {
    throw new Error('Trainer-Profil nicht gefunden');
  }

  // Flatten user data for easier access in the frontend
  const response = {
    ...trainerProfile,
    firstName: trainerProfile.user.firstName,
    lastName: trainerProfile.user.lastName,
    email: trainerProfile.user.email,
    phone: trainerProfile.user.phone,
    birthDate: trainerProfile.user.birthDate,
    gender: trainerProfile.user.gender,
  };

  return successResponse(response);
});

export const PUT = asyncHandler(async (request: Request) => {
  const session = await requireTrainer();
  const body = await request.json();

  let trainerProfileId = session.user.trainerProfileId;

  // Fallback: if trainerProfileId is not in session, query it from the database
  if (!trainerProfileId) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { trainerProfile: true },
    });
    
    if (!user?.trainerProfile) {
      throw new Error('Trainer-Profil nicht gefunden');
    }
    
    trainerProfileId = user.trainerProfile.id;
  }

  const validatedData = updateProfileSchema.parse(body);

  await trainerService.updateProfile(trainerProfileId, validatedData);

  return messageResponse('Profil erfolgreich aktualisiert');
});