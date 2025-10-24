import { requireTrainer } from '@/lib/api/authHelpers';
import { statisticsService } from '@/lib/services/statisticsService';
import { asyncHandler } from '@/lib/api/errorHandlers';
import { successResponse } from '@/lib/api/responseHelpers';

export const GET = asyncHandler(async (request: Request) => {
  const session = await requireTrainer();

  const stats = await statisticsService.getTrainerDashboardStats(session.user.id);

  return successResponse(stats);
});