import { requireAdmin } from '@/lib/api/authHelpers';
import { trainingService } from '@/lib/services/trainingService';
import { asyncHandler } from '@/lib/api/errorHandlers';
import { messageResponse } from '@/lib/api/responseHelpers';
import { z } from 'zod';

const assignAthletesSchema = z.object({
  athleteIds: z.array(z.string().min(1)).min(1, 'Mindestens ein Athlet erforderlich'),
});

const removeAthleteSchema = z.object({
  athleteId: z.string().min(1),
});

export const POST = asyncHandler(
  async (request: Request, { params }: { params: { id: string } }) => {
    const session = await requireAdmin();
    const body = await request.json();

    const validatedData = assignAthletesSchema.parse(body);

    await trainingService.assignAthletesToGroup(
      params.id,
      validatedData.athleteIds,
      session.user.id
    );

    return messageResponse('Athleten erfolgreich zugewiesen', 201);
  }
);

export const DELETE = asyncHandler(
  async (request: Request, { params }: { params: { id: string } }) => {
    await requireAdmin();
    const body = await request.json();

    const validatedData = removeAthleteSchema.parse(body);

    await trainingService.removeAthleteFromGroup(params.id, validatedData.athleteId);

    return messageResponse('Athlet erfolgreich entfernt');
  }
);