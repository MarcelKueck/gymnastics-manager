import { requireAdmin } from '@/lib/api/authHelpers';
import { trainerHoursService } from '@/lib/services/trainerHoursService';
import { asyncHandler } from '@/lib/api/errorHandlers';
import { messageResponse } from '@/lib/api/responseHelpers';
import { z } from 'zod';

const recalculateSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int(),
});

export const POST = asyncHandler(async (request: Request) => {
  await requireAdmin();
  const body = await request.json();

  const validatedData = recalculateSchema.parse(body);

  await trainerHoursService.recalculateMonth(validatedData.month, validatedData.year);

  return messageResponse('Stunden erfolgreich neu berechnet');
});