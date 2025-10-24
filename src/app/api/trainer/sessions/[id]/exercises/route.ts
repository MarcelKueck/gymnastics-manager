import { requireTrainer } from '@/lib/api/authHelpers';
import { sessionService } from '@/lib/services/sessionService';
import { asyncHandler } from '@/lib/api/errorHandlers';
import { messageResponse } from '@/lib/api/responseHelpers';
import { z } from 'zod';

const updateExercisesSchema = z.object({
  updates: z.array(
    z.object({
      sessionGroupId: z.string().min(1),
      exercises: z.string(),
      notes: z.string(),
    })
  ),
});

export const PUT = asyncHandler(
  async (request: Request, { params }: { params: { id: string } }) => {
    await requireTrainer();
    const body = await request.json();

    const validatedData = updateExercisesSchema.parse(body);

    // Update each session group
    await Promise.all(
      validatedData.updates.map((update) =>
        sessionService.updateSessionGroup(
          update.sessionGroupId,
          update.exercises,
          update.notes
        )
      )
    );

    return messageResponse('Übungen erfolgreich gespeichert');
  }
);