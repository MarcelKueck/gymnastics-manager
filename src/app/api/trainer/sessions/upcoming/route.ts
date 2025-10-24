import { requireTrainer } from '@/lib/api/authHelpers';
import { sessionService } from '@/lib/services/sessionService';
import { asyncHandler } from '@/lib/api/errorHandlers';
import { successResponse } from '@/lib/api/responseHelpers';

export const GET = asyncHandler(async (request: Request) => {
  await requireTrainer();
  const { searchParams } = new URL(request.url);

  const limit = parseInt(searchParams.get('limit') || '10', 10);

  const sessions = await sessionService.getUpcomingSessions(limit);

  return successResponse(sessions);
});