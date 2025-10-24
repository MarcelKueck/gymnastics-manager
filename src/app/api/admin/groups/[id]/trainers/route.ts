import { requireAdmin } from '@/lib/api/authHelpers';
import { trainingService } from '@/lib/services/trainingService';
import { asyncHandler } from '@/lib/api/errorHandlers';
import { messageResponse } from '@/lib/api/responseHelpers';
import { z } from 'zod';

const assignTrainerSchema = z.object({
  trainerIds: z.array(z.string().min(1)).optional(),
  trainerId: z.string().min(1).optional(),
  isPrimary: z.boolean().optional(),
}).refine(data => data.trainerIds || data.trainerId, {
  message: "Either trainerIds or trainerId must be provided"
});

const removeTrainerSchema = z.object({
  trainerId: z.string().min(1),
});

export const POST = asyncHandler(
  async (request: Request, { params }: { params: { id: string } }) => {
    const session = await requireAdmin();
    const body = await request.json();

    const validatedData = assignTrainerSchema.parse(body);

    // Support both single trainerId and multiple trainerIds
    const trainerIds = validatedData.trainerIds || (validatedData.trainerId ? [validatedData.trainerId] : []);

    // Assign all trainers to the group
    await Promise.all(
      trainerIds.map(trainerId =>
        trainingService.assignTrainerToGroup(
          params.id,
          trainerId,
          session.user.id,
          validatedData.isPrimary ?? true
        )
      )
    );

    return messageResponse('Trainer erfolgreich zugewiesen', 201);
  }
);

export const DELETE = asyncHandler(
  async (request: Request, { params }: { params: { id: string } }) => {
    await requireAdmin();
    const body = await request.json();

    const validatedData = removeTrainerSchema.parse(body);

    await trainingService.removeTrainerFromGroup(params.id, validatedData.trainerId);

    return messageResponse('Trainer erfolgreich entfernt');
  }
);