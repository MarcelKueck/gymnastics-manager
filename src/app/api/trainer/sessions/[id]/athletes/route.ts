import { requireTrainer } from '@/lib/api/authHelpers';
import { sessionService } from '@/lib/services/sessionService';
import { asyncHandler } from '@/lib/api/errorHandlers';
import { successResponse } from '@/lib/api/responseHelpers';

export const GET = asyncHandler(
  async (request: Request, { params }: { params: { id: string } }) => {
    await requireTrainer();

    const athletesByGroup = await sessionService.getSessionAthletesByGroup(params.id);

    return successResponse(athletesByGroup);
  }
);