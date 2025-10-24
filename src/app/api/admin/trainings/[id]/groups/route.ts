import { requireAdmin } from '@/lib/api/authHelpers';
import { trainingService } from '@/lib/services/trainingService';
import { asyncHandler } from '@/lib/api/errorHandlers';
import { successResponse, messageResponse } from '@/lib/api/responseHelpers';
import { z } from 'zod';

const createGroupSchema = z.object({
  name: z.string().min(1, 'Name erforderlich'),
  sortOrder: z.number().int().min(0).optional(),
});

export const GET = asyncHandler(
  async (request: Request, { params }: { params: { id: string } }) => {
    await requireAdmin();

    const groups = await trainingService.getGroupsForTraining(params.id);

    return successResponse(groups);
  }
);

export const POST = asyncHandler(
  async (request: Request, { params }: { params: { id: string } }) => {
    await requireAdmin();
    const body = await request.json();

    const validatedData = createGroupSchema.parse(body);

    const group = await trainingService.createTrainingGroup(
      params.id,
      validatedData.name,
      validatedData.sortOrder
    );

    return successResponse(group, 201);
  }
);