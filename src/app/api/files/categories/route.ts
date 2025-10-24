import { requireTrainer } from '@/lib/api/authHelpers';
import { fileService } from '@/lib/services/fileService';
import { asyncHandler } from '@/lib/api/errorHandlers';
import { successResponse, messageResponse } from '@/lib/api/responseHelpers';
import { z } from 'zod';

const createCategorySchema = z.object({
  name: z.string().min(1, 'Name erforderlich'),
  description: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const GET = asyncHandler(async (request: Request) => {
  await requireTrainer();
  const { searchParams } = new URL(request.url);

  const activeOnly = searchParams.get('activeOnly') !== 'false';

  const categories = await fileService.getAllCategories(activeOnly);

  return successResponse(categories);
});

export const POST = asyncHandler(async (request: Request) => {
  await requireTrainer();
  const body = await request.json();

  const validatedData = createCategorySchema.parse(body);

  const category = await fileService.createCategory(
    validatedData.name,
    validatedData.description,
    validatedData.sortOrder
  );

  return successResponse(category, 201);
});