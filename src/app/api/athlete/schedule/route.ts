import { requireAthlete } from '@/lib/api/authHelpers';
import { sessionService } from '@/lib/services/sessionService';
import { asyncHandler } from '@/lib/api/errorHandlers';
import { successResponse } from '@/lib/api/responseHelpers';

export const GET = asyncHandler(async (request: Request) => {
  const session = await requireAthlete();
  const { searchParams } = new URL(request.url);

  const dateFrom = searchParams.get('dateFrom')
    ? new Date(searchParams.get('dateFrom')!)
    : new Date();
  const dateTo = searchParams.get('dateTo')
    ? new Date(searchParams.get('dateTo')!)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days ahead

  const sessions = await sessionService.getAthletesSessions(
    session.user.id,
    dateFrom,
    dateTo
  );

  return successResponse(sessions);
});