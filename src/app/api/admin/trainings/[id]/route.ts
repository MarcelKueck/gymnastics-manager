import { requireAdmin } from '@/lib/api/authHelpers';
import { trainingService } from '@/lib/services/trainingService';
import { asyncHandler } from '@/lib/api/errorHandlers';
import { successResponse, messageResponse, notFoundResponse } from '@/lib/api/responseHelpers';
import { z } from 'zod';
import { DayOfWeek, RecurrenceInterval } from '@prisma/client';

const updateTrainingSchema = z.object({
  name: z.string().min(1).optional(),
  dayOfWeek: z.nativeEnum(DayOfWeek).optional(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  recurrence: z.nativeEnum(RecurrenceInterval).optional(),
  isActive: z.boolean().optional(),
  validFrom: z.string().nullable().optional(),
  validUntil: z.string().nullable().optional(),
});

export const PUT = asyncHandler(
  async (request: Request, { params }: { params: { id: string } }) => {
    await requireAdmin();
    const body = await request.json();

    const validatedData = updateTrainingSchema.parse(body);

    const training = await trainingService.updateRecurringTraining(params.id, validatedData);

    // Regenerate future sessions to reflect the changes
    await trainingService.generateSessions(90);

    return successResponse(training);
  }
);

export const DELETE = asyncHandler(
  async (request: Request, { params }: { params: { id: string } }) => {
    await requireAdmin();

    await trainingService.deleteRecurringTraining(params.id);

    return messageResponse('Training erfolgreich gelöscht');
  }
);