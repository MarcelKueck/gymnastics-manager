import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/authHelpers';
import { fileService } from '@/lib/services/fileService';
import { readFile } from 'fs/promises';
import { asyncHandler } from '@/lib/api/errorHandlers';

export const GET = asyncHandler(
  async (request: Request, { params }: { params: { id: string } }) => {
    await requireAuth();

    const upload = await fileService.getFile(params.id);

    if (!upload) {
      return new NextResponse('Datei nicht gefunden', { status: 404 });
    }

    const fileBuffer = await readFile(upload.filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': upload.mimeType,
        'Content-Disposition': `attachment; filename="${upload.fileName}"`,
        'Content-Length': upload.fileSize.toString(),
      },
    });
  }
);