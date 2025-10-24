import { requireTrainer } from '@/lib/api/authHelpers';
import { athleteService } from '@/lib/services/athleteService';
import { asyncHandler } from '@/lib/api/errorHandlers';
import { successResponse, notFoundResponse } from '@/lib/api/responseHelpers';

export const GET = asyncHandler(
  async (request: Request, { params }: { params: { id: string } }) => {
    await requireTrainer();

    const athlete = await athleteService.getAthleteDetails(params.id);

    if (!athlete) {
      return notFoundResponse('Athlet');
    }

    return successResponse(athlete);
  }
);