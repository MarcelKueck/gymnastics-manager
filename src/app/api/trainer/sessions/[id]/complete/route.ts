import { requireTrainer } from '@/lib/api/authHelpers';
import { sessionService } from '@/lib/services/sessionService';
import { asyncHandler } from '@/lib/api/errorHandlers';
import { messageResponse } from '@/lib/api/responseHelpers';

export const POST = asyncHandler(
  async (request: Request, { params }: { params: { id: string } }) => {
    await requireTrainer();

    await sessionService.markSessionCompleted(params.id);

    return messageResponse('Trainingseinheit als abgeschlossen markiert');
  }
);