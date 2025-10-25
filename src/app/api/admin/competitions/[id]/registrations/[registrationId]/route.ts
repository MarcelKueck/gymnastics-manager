import { requireAdmin } from '@/lib/api/authHelpers';
import { competitionService } from '@/lib/services/competitionService';
import { asyncHandler } from '@/lib/api/errorHandlers';
import { successResponse } from '@/lib/api/responseHelpers';
import { z } from 'zod';

const updateRegistrationSchema = z.object({
  attended: z.boolean().optional(),
  placement: z.number().int().positive().optional().nullable(),
  score: z.number().nonnegative().optional().nullable(),
  notes: z.string().optional(),
});

export const PUT = asyncHandler(
  async (
    request: Request,
    { params }: { params: { id: string; registrationId: string } }
  ) => {
    await requireAdmin();
    const body = await request.json();

    const validatedData = updateRegistrationSchema.parse(body);

    const registration = await competitionService.updateRegistration(
      params.registrationId,
      validatedData
    );

    return successResponse(registration);
  }
);
