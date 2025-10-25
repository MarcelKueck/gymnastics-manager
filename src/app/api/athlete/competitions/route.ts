import { requireAthlete } from '@/lib/api/authHelpers';
import { competitionService } from '@/lib/services/competitionService';
import { asyncHandler } from '@/lib/api/errorHandlers';
import { successResponse } from '@/lib/api/responseHelpers';

export const GET = asyncHandler(async (request: Request) => {
  const session = await requireAthlete();

  const competitions = await competitionService.getPublishedCompetitions(
    session.user.athleteProfileId!
  );

  return successResponse(competitions);
});
