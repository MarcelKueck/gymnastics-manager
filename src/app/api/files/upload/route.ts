import { requireTrainer } from '@/lib/api/authHelpers';
import { fileService } from '@/lib/services/fileService';
import { asyncHandler } from '@/lib/api/errorHandlers';
import { successResponse } from '@/lib/api/responseHelpers';

export const POST = asyncHandler(async (request: Request) => {
  const session = await requireTrainer();

  const formData = await request.formData();
  const file = formData.get('file') as File;
  const categoryId = formData.get('categoryId') as string;
  const title = formData.get('title') as string;
  const targetDate = formData.get('targetDate') as string | null;

  if (!file) {
    throw new Error('Keine Datei hochgeladen');
  }

  if (!categoryId || !title) {
    throw new Error('Kategorie und Titel sind erforderlich');
  }

  const upload = await fileService.uploadFile(
    categoryId,
    title,
    file,
    session.user.id,
    targetDate || undefined
  );

  return successResponse(upload, 201);
});