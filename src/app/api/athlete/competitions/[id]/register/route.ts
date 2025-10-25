import { requireAthlete } from '@/lib/api/authHelpers';
import { competitionService } from '@/lib/services/competitionService';
import { asyncHandler } from '@/lib/api/errorHandlers';
import { successResponse, messageResponse } from '@/lib/api/responseHelpers';
import { z } from 'zod';

const registerSchema = z.object({
  notes: z.string().optional(),
});

export const POST = asyncHandler(
  async (request: Request, { params }: { params: { id: string } }) => {
    const session = await requireAthlete();
    const body = await request.json();

    const validatedData = registerSchema.parse(body);

    const registration = await competitionService.registerAthlete(
      session.user.athleteProfileId!,
      params.id,
      validatedData.notes
    );

    return successResponse(registration);
  }
);

export const DELETE = asyncHandler(
  async (request: Request, { params }: { params: { id: string } }) => {
    const session = await requireAthlete();

    await competitionService.unregisterAthlete(session.user.athleteProfileId!, params.id);

    return messageResponse('Erfolgreich abgemeldet');
  }
);
