import { requireAthlete } from '@/lib/api/authHelpers';
import { athleteService } from '@/lib/services/athleteService';
import { handleApiError, asyncHandler } from '@/lib/api/errorHandlers';
import { successResponse } from '@/lib/api/responseHelpers';
import { athleteProfileUpdateSchema } from '@/lib/validation/athlete';
import { prisma } from '@/lib/prisma';

export const GET = asyncHandler(async (request: Request) => {
  const session = await requireAthlete();

  let athleteProfileId = session.user.athleteProfileId;

  // Fallback: if athleteProfileId is not in session, query it from the database
  if (!athleteProfileId) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { athleteProfile: true },
    });
    
    if (!user) {
      throw new Error('Benutzer nicht gefunden. Bitte melden Sie sich erneut an.');
    }
    
    if (!user.athleteProfile) {
      throw new Error('Athleten-Profil nicht gefunden. Bitte melden Sie sich erneut an.');
    }
    
    athleteProfileId = user.athleteProfile.id;
  }

  const athleteProfile = await athleteService.getAthleteDetails(athleteProfileId);

  if (!athleteProfile) {
    throw new Error('Athleten-Profil nicht gefunden');
  }

  // Flatten user data for easier access in the frontend
  const response = {
    ...athleteProfile,
    firstName: athleteProfile.user.firstName,
    lastName: athleteProfile.user.lastName,
    email: athleteProfile.user.email,
    phone: athleteProfile.user.phone,
    birthDate: athleteProfile.user.birthDate,
    gender: athleteProfile.user.gender,
  };

  return successResponse(response);
});

export const PUT = asyncHandler(async (request: Request) => {
  const session = await requireAthlete();
  const body = await request.json();

  let athleteProfileId = session.user.athleteProfileId;

  // Fallback: if athleteProfileId is not in session, query it from the database
  if (!athleteProfileId) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { athleteProfile: true },
    });
    
    if (!user?.athleteProfile) {
      throw new Error('Athleten-Profil nicht gefunden');
    }
    
    athleteProfileId = user.athleteProfile.id;
  }

  const validatedData = athleteProfileUpdateSchema.parse(body);

  const athleteProfile = await athleteService.updateProfile(athleteProfileId, validatedData);

  if (!athleteProfile) {
    throw new Error('Fehler beim Aktualisieren des Profils');
  }

  // Flatten user data for easier access in the frontend
  const response = {
    ...athleteProfile,
    firstName: athleteProfile.user.firstName,
    lastName: athleteProfile.user.lastName,
    email: athleteProfile.user.email,
    phone: athleteProfile.user.phone,
    birthDate: athleteProfile.user.birthDate,
    gender: athleteProfile.user.gender,
  };

  return successResponse(response);
});