import { requireAdmin } from '@/lib/api/authHelpers';
import { trainerHoursService } from '@/lib/services/trainerHoursService';
import { asyncHandler } from '@/lib/api/errorHandlers';
import { messageResponse } from '@/lib/api/responseHelpers';
import { z } from 'zod';

const adjustHoursSchema = z.object({
  trainerId: z.string().min(1),
  month: z.number().int().min(1).max(12),
  year: z.number().int(),
  adjustedHours: z.number().min(0),
  notes: z.string().optional(),
});

export const POST = asyncHandler(async (request: Request) => {
  const session = await requireAdmin();
  const body = await request.json();

  const validatedData = adjustHoursSchema.parse(body);

  await trainerHoursService.adjustMonthlyHours(
    validatedData.trainerId,
    validatedData.month,
    validatedData.year,
    validatedData.adjustedHours,
    session.user.id,
    validatedData.notes
  );

  return messageResponse('Stunden erfolgreich angepasst');
});