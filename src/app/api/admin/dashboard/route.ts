import { requireAdmin } from '@/lib/api/authHelpers';
import { statisticsService } from '@/lib/services/statisticsService';
import { asyncHandler } from '@/lib/api/errorHandlers';
import { successResponse } from '@/lib/api/responseHelpers';

export const GET = asyncHandler(async (request: Request) => {
  await requireAdmin();

  const stats = await statisticsService.getAdminDashboardStats();

  return successResponse(stats);
});