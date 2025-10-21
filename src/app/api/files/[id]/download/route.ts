import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: uploadId } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get upload details
    const upload = await prisma.upload.findUnique({
      where: { id: uploadId, isActive: true },
    });

    if (!upload) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Read file
    const fullPath = join(process.cwd(), 'public', upload.filePath);
    const fileBuffer = await readFile(fullPath);

    // Return file
    return new NextResponse(fileBuffer as any, {
      headers: {
        'Content-Type': upload.mimeType,
        'Content-Disposition': `attachment; filename="${upload.fileName}"`,
        'Content-Length': upload.fileSize.toString(),
      },
    });
  } catch (error) {
    console.error('Download training plan error:', error);
    return NextResponse.json(
      { error: 'Failed to download training plan' },
      { status: 500 }
    );
  }
}