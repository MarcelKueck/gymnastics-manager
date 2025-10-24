import { requireAthlete } from '@/lib/api/authHelpers';
import { athleteService } from '@/lib/services/athleteService';
import { handleApiError, asyncHandler } from '@/lib/api/errorHandlers';
import { successResponse } from '@/lib/api/responseHelpers';
import { athleteProfileUpdateSchema } from '@/lib/validation/athlete';

export const GET = asyncHandler(async (request: Request) => {
  const session = await requireAthlete();

  const athlete = await athleteService.getAthleteDetails(session.user.id);

  return successResponse(athlete);
});

export const PUT = asyncHandler(async (request: Request) => {
  const session = await requireAthlete();
  const body = await request.json();

  const validatedData = athleteProfileUpdateSchema.parse(body);

  const athlete = await athleteService.updateProfile(session.user.id, validatedData);

  return successResponse(athlete);
});