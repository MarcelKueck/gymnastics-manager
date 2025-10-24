import { requireAuth } from '@/lib/api/authHelpers';
import { fileService } from '@/lib/services/fileService';
import { asyncHandler } from '@/lib/api/errorHandlers';
import { successResponse } from '@/lib/api/responseHelpers';

export const GET = asyncHandler(async (request: Request) => {
  await requireAuth();
  const { searchParams } = new URL(request.url);

  const categoryId = searchParams.get('categoryId') || undefined;
  const query = searchParams.get('query') || undefined;

  let files;
  if (query) {
    files = await fileService.searchFiles(query, categoryId);
  } else if (categoryId) {
    files = await fileService.getFilesByCategory(categoryId);
  } else {
    files = await fileService.getAllFiles();
  }

  return successResponse(files);
});