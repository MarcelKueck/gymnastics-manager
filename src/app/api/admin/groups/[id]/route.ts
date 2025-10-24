import { requireAdmin } from '@/lib/api/authHelpers';
import { trainingService } from '@/lib/services/trainingService';
import { asyncHandler } from '@/lib/api/errorHandlers';
import { successResponse, messageResponse } from '@/lib/api/responseHelpers';
import { z } from 'zod';

const updateGroupSchema = z.object({
  name: z.string().min(1).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const GET = asyncHandler(
  async (request: Request, { params }: { params: { id: string } }) => {
    await requireAdmin();

    const group = await trainingService.getGroupDetails(params.id);

    return successResponse(group);
  }
);

export const PUT = asyncHandler(
  async (request: Request, { params }: { params: { id: string } }) => {
    await requireAdmin();
    const body = await request.json();

    const validatedData = updateGroupSchema.parse(body);

    const group = await trainingService.updateTrainingGroup(params.id, validatedData);

    return successResponse(group);
  }
);

export const DELETE = asyncHandler(
  async (request: Request, { params }: { params: { id: string } }) => {
    await requireAdmin();

    await trainingService.deleteTrainingGroup(params.id);

    return messageResponse('Gruppe erfolgreich gelöscht');
  }
);