import { requireAdmin } from '@/lib/api/authHelpers';
import { trainerService } from '@/lib/services/trainerService';
import { asyncHandler } from '@/lib/api/errorHandlers';
import { messageResponse } from '@/lib/api/responseHelpers';

export const POST = asyncHandler(
  async (request: Request, { params }: { params: { id: string } }) => {
    await requireAdmin();

    await trainerService.activate(params.id);

    return messageResponse('Trainer erfolgreich aktiviert');
  }
);