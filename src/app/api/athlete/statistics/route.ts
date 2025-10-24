import { requireAthlete } from '@/lib/api/authHelpers';
import { athleteService } from '@/lib/services/athleteService';
import { asyncHandler } from '@/lib/api/errorHandlers';
import { successResponse } from '@/lib/api/responseHelpers';

export const GET = asyncHandler(async (request: Request) => {
  const session = await requireAthlete();
  const { searchParams } = new URL(request.url);

  const dateFrom = searchParams.get('dateFrom')
    ? new Date(searchParams.get('dateFrom')!)
    : undefined;
  const dateTo = searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined;

  const stats = await athleteService.getStatistics(session.user.id, dateFrom, dateTo);

  return successResponse(stats);
});