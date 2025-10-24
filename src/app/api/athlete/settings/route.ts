import { requireAthlete } from '@/lib/api/authHelpers';
import { settingsService } from '@/lib/services/settingsService';
import { asyncHandler } from '@/lib/api/errorHandlers';
import { successResponse } from '@/lib/api/responseHelpers';

export const GET = asyncHandler(async (request: Request) => {
  await requireAthlete();

  const deadlineHours = await settingsService.getCancellationDeadlineHours();

  return successResponse({ cancellationDeadlineHours: deadlineHours });
});
