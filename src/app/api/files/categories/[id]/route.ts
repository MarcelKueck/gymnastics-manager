import { requireTrainer } from '@/lib/api/authHelpers';
import { fileService } from '@/lib/services/fileService';
import { asyncHandler } from '@/lib/api/errorHandlers';
import { messageResponse } from '@/lib/api/responseHelpers';
import { z } from 'zod';

const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const PUT = asyncHandler(
  async (request: Request, { params }: { params: { id: string } }) => {
    await requireTrainer();
    const body = await request.json();

    const validatedData = updateCategorySchema.parse(body);

    await fileService.updateCategory(params.id, validatedData);

    return messageResponse('Kategorie erfolgreich aktualisiert');
  }
);

export const DELETE = asyncHandler(
  async (request: Request, { params }: { params: { id: string } }) => {
    await requireTrainer();

    await fileService.deleteCategory(params.id);

    return messageResponse('Kategorie erfolgreich gelöscht');
  }
);