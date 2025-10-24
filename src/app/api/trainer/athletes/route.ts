import { requireTrainer } from '@/lib/api/authHelpers';
import { athleteService } from '@/lib/services/athleteService';
import { asyncHandler } from '@/lib/api/errorHandlers';
import { successResponse } from '@/lib/api/responseHelpers';
import { YouthCategory } from '@prisma/client';

export const GET = asyncHandler(async (request: Request) => {
  await requireTrainer();
  const { searchParams } = new URL(request.url);

  const query = searchParams.get('query') || undefined;
  const status = (searchParams.get('status') as 'all' | 'approved' | 'pending') || 'all';
  const youthCategory = searchParams.get('youthCategory') as YouthCategory | undefined;
  const competitionOnly = searchParams.get('competitionOnly') === 'true';

  const athletes = await athleteService.searchAthletes({
    query,
    status,
    youthCategory,
    competitionOnly,
  });

  return successResponse(athletes);
});