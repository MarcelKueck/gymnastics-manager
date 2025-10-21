// src/app/api/trainer/uploads/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { sendTrainingPlanUploadedEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'TRAINER' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const categoryId = formData.get('categoryId') as string;
    const title = formData.get('title') as string;
    const targetDate = formData.get('targetDate') as string | null;

    if (!file || !categoryId || !title) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'Only PDF files are allowed' },
        { status: 400 }
      );
    }

    // Validate category exists
    const category = await prisma.uploadCategory.findUnique({
      where: { id: categoryId, isActive: true },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'uploads', 'files');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, that's fine
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filepath = path.join(uploadDir, filename);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Create database record
    const upload = await prisma.upload.create({
      data: {
        title,
        categoryId,
        fileName: file.name,
        fileSize: buffer.length,
        mimeType: file.type || 'application/pdf',
        filePath: `/uploads/files/${filename}`,
        targetDate: targetDate || null,
        uploadedBy: session.user.id,
      },
      include: {
        category: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        performedBy: session.user.id,
        action: 'create',
        entityType: 'upload',
        entityId: upload.id,
        changes: {
          title,
          categoryId,
          categoryName: category.name,
          filename,
          targetDate,
        },
        reason: 'File uploaded',
      },
    });

    // Get all approved athletes' emails
    const approvedAthletes = await prisma.athlete.findMany({
      where: {
        isApproved: true,
      },
      select: {
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    // Send notification emails to all approved athletes
    if (approvedAthletes.length > 0) {
      try {
        await sendTrainingPlanUploadedEmail({
          athleteEmails: approvedAthletes.map(a => ({ 
            email: a.email, 
            name: `${a.firstName} ${a.lastName}` 
          })),
          category: category.name,
          title,
          targetDate: targetDate || undefined,
        });
        console.log(`✅ Upload notification emails sent to ${approvedAthletes.length} athletes`);
      } catch (emailError) {
        console.error('❌ Failed to send upload notification emails:', emailError);
      }
    }

    return NextResponse.json({
      message: 'File uploaded successfully',
      upload,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'TRAINER' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const uploads = await prisma.upload.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        category: true,
        uploadedByTrainer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ uploads });
  } catch (error) {
    console.error('Error fetching uploads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch uploads' },
      { status: 500 }
    );
  }
}