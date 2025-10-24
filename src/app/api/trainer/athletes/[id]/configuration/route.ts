import { requireTrainer } from '@/lib/api/authHelpers';
import { athleteService } from '@/lib/services/athleteService';
import { asyncHandler } from '@/lib/api/errorHandlers';
import { messageResponse } from '@/lib/api/responseHelpers';
import { z } from 'zod';
import { YouthCategory } from '@prisma/client';

const configurationSchema = z.object({
  youthCategory: z.nativeEnum(YouthCategory).optional(),
  competitionParticipation: z.boolean().optional(),
  hasDtbId: z.boolean().optional(),
  trainingGroupIds: z.array(z.string().min(1)).optional(),
});

export const PUT = asyncHandler(
  async (request: Request, { params }: { params: { id: string } }) => {
    const session = await requireTrainer();
    const body = await request.json();

    const validatedData = configurationSchema.parse(body);

    await athleteService.updateConfiguration(params.id, session.user.id, validatedData);

    return messageResponse('Konfiguration erfolgreich aktualisiert');
  }
);