import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { readFile, unlink } from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    }

    const { id } = await params;

    // Get the file record
    const upload = await prisma.upload.findUnique({
      where: { id },
    });

    if (!upload || !upload.isActive) {
      return NextResponse.json({ error: 'Datei nicht gefunden' }, { status: 404 });
    }

    // Read the file
    const filePath = path.join(process.cwd(), UPLOAD_DIR, upload.filePath);
    
    try {
      const fileBuffer = await readFile(filePath);
      
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': upload.mimeType,
          'Content-Disposition': `attachment; filename="${encodeURIComponent(upload.fileName)}"`,
          'Content-Length': upload.fileSize.toString(),
        },
      });
    } catch {
      console.error('File not found on disk:', filePath);
      return NextResponse.json({ error: 'Datei nicht gefunden' }, { status: 404 });
    }
  } catch (error) {
    console.error('File download error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Herunterladen der Datei' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    }

    if (session.user.activeRole !== 'TRAINER' && session.user.activeRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 });
    }

    const { id } = await params;

    // Get the file record
    const upload = await prisma.upload.findUnique({
      where: { id },
    });

    if (!upload) {
      return NextResponse.json({ error: 'Datei nicht gefunden' }, { status: 404 });
    }

    // Delete the physical file
    const filePath = path.join(process.cwd(), UPLOAD_DIR, upload.filePath);
    try {
      await unlink(filePath);
    } catch {
      console.warn('Could not delete physical file:', filePath);
    }

    // Mark as inactive (soft delete) or hard delete
    await prisma.upload.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: 'Datei erfolgreich gelöscht',
    });
  } catch (error) {
    console.error('File delete error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Löschen der Datei' },
      { status: 500 }
    );
  }
}
