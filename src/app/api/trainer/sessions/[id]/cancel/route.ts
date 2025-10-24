import { requireTrainer } from '@/lib/api/authHelpers';
import { sessionService } from '@/lib/services/sessionService';
import { asyncHandler } from '@/lib/api/errorHandlers';
import { messageResponse } from '@/lib/api/responseHelpers';
import { z } from 'zod';

const cancelSessionSchema = z.object({
  reason: z.string().min(10, 'Grund muss mindestens 10 Zeichen lang sein'),
});

export const POST = asyncHandler(
  async (request: Request, { params }: { params: { id: string } }) => {
    const session = await requireTrainer();
    const body = await request.json();

    const validatedData = cancelSessionSchema.parse(body);

    await sessionService.cancelSession(params.id, session.user.id, validatedData.reason);

    return messageResponse('Trainingseinheit abgesagt');
  }
);