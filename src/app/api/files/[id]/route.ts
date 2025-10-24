import { requireTrainer } from '@/lib/api/authHelpers';
import { fileService } from '@/lib/services/fileService';
import { asyncHandler } from '@/lib/api/errorHandlers';
import { successResponse, messageResponse } from '@/lib/api/responseHelpers';
import { z } from 'zod';

const updateFileSchema = z.object({
  title: z.string().min(1).optional(),
  targetDate: z.string().optional(),
  categoryId: z.string().min(1).optional(),
});

export const GET = asyncHandler(
  async (request: Request, { params }: { params: { id: string } }) => {
    await requireTrainer();

    const file = await fileService.getFile(params.id);

    return successResponse(file);
  }
);

export const PUT = asyncHandler(
  async (request: Request, { params }: { params: { id: string } }) => {
    await requireTrainer();
    const body = await request.json();

    const validatedData = updateFileSchema.parse(body);

    await fileService.updateFile(params.id, validatedData);

    return messageResponse('Datei erfolgreich aktualisiert');
  }
);

export const DELETE = asyncHandler(
  async (request: Request, { params }: { params: { id: string } }) => {
    await requireTrainer();

    await fileService.deleteFile(params.id);

    return messageResponse('Datei erfolgreich gelöscht');
  }
);