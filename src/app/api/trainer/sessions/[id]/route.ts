import { requireTrainer } from '@/lib/api/authHelpers';
import { sessionService } from '@/lib/services/sessionService';
import { asyncHandler } from '@/lib/api/errorHandlers';
import { successResponse, notFoundResponse, messageResponse } from '@/lib/api/responseHelpers';
import { z } from 'zod';

const updateSessionSchema = z.object({
  notes: z.string().optional(),
});

export const GET = asyncHandler(
  async (request: Request, { params }: { params: { id: string } }) => {
    await requireTrainer();

    const session = await sessionService.getSessionDetails(params.id);

    if (!session) {
      return notFoundResponse('Trainingseinheit');
    }

    return successResponse(session);
  }
);

export const PUT = asyncHandler(
  async (request: Request, { params }: { params: { id: string } }) => {
    await requireTrainer();
    const body = await request.json();

    const validatedData = updateSessionSchema.parse(body);

    await sessionService.updateSessionNotes(params.id, validatedData.notes || '');

    return messageResponse('Trainingseinheit aktualisiert');
  }
);