import { requireAdmin } from '@/lib/api/authHelpers';
import { trainingService } from '@/lib/services/trainingService';
import { asyncHandler } from '@/lib/api/errorHandlers';
import { successResponse } from '@/lib/api/responseHelpers';
import { z } from 'zod';

const generateSessionsSchema = z.object({
  daysAhead: z.number().int().min(1).max(365).optional(),
});

export const POST = asyncHandler(async (request: Request) => {
  await requireAdmin();
  const body = await request.json();

  const validatedData = generateSessionsSchema.parse(body);

  const sessions = await trainingService.generateSessions(validatedData.daysAhead || 90);

  return successResponse({
    message: `${sessions.length} Trainingseinheiten erfolgreich erstellt`,
    count: sessions.length,
  });
});