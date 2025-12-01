import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const ALLOWED_MIME_TYPES = ['application/pdf'];

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    }

    if (session.user.activeRole !== 'TRAINER' && session.user.activeRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 });
    }

    // Get trainer profile
    const trainerProfile = await prisma.trainerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!trainerProfile) {
      return NextResponse.json({ error: 'Trainer-Profil nicht gefunden' }, { status: 404 });
    }

    // Get system settings for max file size
    const settings = await prisma.systemSettings.findUnique({
      where: { id: 'default' },
    });
    const maxFileSizeMB = settings?.maxUploadSizeMB ?? 10;
    const maxFileSize = maxFileSizeMB * 1024 * 1024;

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const categoryId = formData.get('categoryId') as string | null;
    const title = formData.get('title') as string | null;
    const targetDate = formData.get('targetDate') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'Keine Datei ausgewählt' }, { status: 400 });
    }

    if (!categoryId) {
      return NextResponse.json({ error: 'Kategorie erforderlich' }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ error: 'Titel erforderlich' }, { status: 400 });
    }

    // Validate category exists
    const category = await prisma.uploadCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json({ error: 'Kategorie nicht gefunden' }, { status: 404 });
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Nur PDF-Dateien sind erlaubt' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > maxFileSize) {
      return NextResponse.json(
        { error: `Datei ist zu groß (max. ${maxFileSizeMB}MB)` },
        { status: 400 }
      );
    }

    // Create upload directory if it doesn't exist
    const uploadPath = path.join(process.cwd(), UPLOAD_DIR, categoryId);
    await mkdir(uploadPath, { recursive: true });

    // Generate unique filename
    const fileExtension = path.extname(file.name);
    const uniqueFilename = `${randomUUID()}${fileExtension}`;
    const filePath = path.join(uploadPath, uniqueFilename);

    // Write file to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    // Create database record
    const upload = await prisma.upload.create({
      data: {
        categoryId,
        title,
        targetDate,
        filePath: path.join(categoryId, uniqueFilename),
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        uploadedBy: trainerProfile.id,
      },
      include: {
        category: true,
        uploadedByTrainer: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: upload,
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Hochladen der Datei' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    const whereClause: { isActive: boolean; categoryId?: string } = {
      isActive: true,
    };

    if (categoryId) {
      whereClause.categoryId = categoryId;
    }

    const files = await prisma.upload.findMany({
      where: whereClause,
      include: {
        category: true,
        uploadedByTrainer: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
      orderBy: [
        { category: { sortOrder: 'asc' } },
        { uploadedAt: 'desc' },
      ],
    });

    return NextResponse.json({
      success: true,
      data: files,
    });
  } catch (error) {
    console.error('File list error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Dateien' },
      { status: 500 }
    );
  }
}
