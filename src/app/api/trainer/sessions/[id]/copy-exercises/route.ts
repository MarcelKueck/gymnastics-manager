import { requireTrainer } from '@/lib/api/authHelpers';
import { sessionService } from '@/lib/services/sessionService';
import { asyncHandler } from '@/lib/api/errorHandlers';
import { successResponse } from '@/lib/api/responseHelpers';
import { z } from 'zod';

const copyExercisesSchema = z.object({
  sessionGroupId: z.string().min(1),
});

export const POST = asyncHandler(
  async (request: Request, { params }: { params: { id: string } }) => {
    await requireTrainer();
    const body = await request.json();

    const validatedData = copyExercisesSchema.parse(body);

    const updatedGroup = await sessionService.copyExercisesFromPreviousWeek(
      validatedData.sessionGroupId
    );

    return successResponse(updatedGroup);
  }
);