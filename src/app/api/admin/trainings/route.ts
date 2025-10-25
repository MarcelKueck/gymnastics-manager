import { requireAdmin } from '@/lib/api/authHelpers';
import { trainingService } from '@/lib/services/trainingService';
import { asyncHandler } from '@/lib/api/errorHandlers';
import { successResponse, messageResponse } from '@/lib/api/responseHelpers';
import { z } from 'zod';
import { DayOfWeek, RecurrenceInterval } from '@prisma/client';

const createTrainingSchema = z.object({
  name: z.string().min(1, 'Name erforderlich'),
  dayOfWeek: z.nativeEnum(DayOfWeek),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Ungültige Zeitangabe'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Ungültige Zeitangabe'),
  recurrence: z.nativeEnum(RecurrenceInterval),
  isActive: z.boolean().optional(),
  validFrom: z.string().nullable().optional(),
  validUntil: z.string().nullable().optional(),
}).refine(
  (data) => {
    // For ONCE recurrence, validFrom is required
    if (data.recurrence === RecurrenceInterval.ONCE && !data.validFrom) {
      return false;
    }
    return true;
  },
  {
    message: 'Für einmalige Trainings muss ein Datum angegeben werden',
    path: ['validFrom'],
  }
).refine(
  (data) => {
    // If both dates are provided, validFrom must be before validUntil
    if (data.validFrom && data.validUntil) {
      return new Date(data.validFrom) <= new Date(data.validUntil);
    }
    return true;
  },
  {
    message: 'Enddatum muss nach oder gleich Startdatum sein',
    path: ['validUntil'],
  }
);

export const GET = asyncHandler(async (request: Request) => {
  await requireAdmin();
  const { searchParams } = new URL(request.url);

  const activeOnly = searchParams.get('activeOnly') !== 'false';

  const trainings = await trainingService.getAllRecurringTrainings(activeOnly);

  return successResponse(trainings);
});

export const POST = asyncHandler(async (request: Request) => {
  const session = await requireAdmin();
  const body = await request.json();

  const validatedData = createTrainingSchema.parse(body);

  const training = await trainingService.createRecurringTraining(validatedData, session.user.id);

  // Auto-generate sessions for the next 90 days
  await trainingService.generateSessions(90);

  return successResponse(training, 201);
});