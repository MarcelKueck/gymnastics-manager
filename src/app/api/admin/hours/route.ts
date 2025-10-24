import { requireAdmin } from '@/lib/api/authHelpers';
import { trainerHoursService } from '@/lib/services/trainerHoursService';
import { asyncHandler } from '@/lib/api/errorHandlers';
import { successResponse } from '@/lib/api/responseHelpers';

export const GET = asyncHandler(async (request: Request) => {
  await requireAdmin();
  const { searchParams } = new URL(request.url);

  const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1), 10);
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()), 10);

  const summaries = await trainerHoursService.getAllSummariesForMonth(month, year);

  return successResponse(summaries);
});