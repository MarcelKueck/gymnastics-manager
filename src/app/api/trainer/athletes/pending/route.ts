import { requireTrainer } from '@/lib/api/authHelpers';
import { athleteService } from '@/lib/services/athleteService';
import { asyncHandler } from '@/lib/api/errorHandlers';
import { successResponse } from '@/lib/api/responseHelpers';

export const GET = asyncHandler(async (request: Request) => {
  await requireTrainer();

  const pendingAthletes = await athleteService.getPendingApprovals();

  return successResponse(pendingAthletes);
});