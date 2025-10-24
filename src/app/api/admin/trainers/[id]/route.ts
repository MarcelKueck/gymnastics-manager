import { requireAdmin } from '@/lib/api/authHelpers';
import { trainerService } from '@/lib/services/trainerService';
import { asyncHandler } from '@/lib/api/errorHandlers';
import { successResponse, messageResponse } from '@/lib/api/responseHelpers';
import { z } from 'zod';
import { UserRole } from '@prisma/client';

const updateTrainerSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  role: z.nativeEnum(UserRole).optional(),
});

export const GET = asyncHandler(
  async (request: Request, { params }: { params: { id: string } }) => {
    await requireAdmin();

    const trainer = await trainerService.getDetails(params.id);

    return successResponse(trainer);
  }
);

export const PUT = asyncHandler(
  async (request: Request, { params }: { params: { id: string } }) => {
    await requireAdmin();
    const body = await request.json();

    const validatedData = updateTrainerSchema.parse(body);

    await trainerService.updateProfile(params.id, validatedData);

    if (validatedData.role) {
      await trainerService.changeRole(params.id, validatedData.role);
    }

    return messageResponse('Trainer erfolgreich aktualisiert');
  }
);