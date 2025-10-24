import { requireAthlete } from '@/lib/api/authHelpers';
import { attendanceService } from '@/lib/services/attendanceService';
import { asyncHandler } from '@/lib/api/errorHandlers';
import { successResponse } from '@/lib/api/responseHelpers';

export const GET = asyncHandler(async (request: Request) => {
  const session = await requireAthlete();
  const { searchParams } = new URL(request.url);

  const dateFrom = searchParams.get('dateFrom')
    ? new Date(searchParams.get('dateFrom')!)
    : undefined;
  const dateTo = searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined;

  const attendance = await attendanceService.getAthleteAttendance(
    session.user.id,
    dateFrom,
    dateTo
  );

  return successResponse(attendance);
});