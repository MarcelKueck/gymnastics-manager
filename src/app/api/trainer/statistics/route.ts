import { requireTrainer } from '@/lib/api/authHelpers';
import { statisticsService } from '@/lib/services/statisticsService';
import { asyncHandler } from '@/lib/api/errorHandlers';
import { successResponse } from '@/lib/api/responseHelpers';

export const GET = asyncHandler(async (request: Request) => {
  await requireTrainer();
  const { searchParams } = new URL(request.url);

  const dateFrom = searchParams.get('dateFrom')
    ? new Date(searchParams.get('dateFrom')!)
    : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const dateTo = searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : new Date();

  const stats = await statisticsService.getAttendanceStatistics(dateFrom, dateTo);

  return successResponse(stats);
});