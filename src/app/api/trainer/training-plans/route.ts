import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'TRAINER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const plans = await prisma.trainingPlan.findMany({
      where: {
        isActive: true,
      },
      include: {
        uploadedByTrainer: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { category: 'asc' },
        { uploadedAt: 'desc' },
      ],
    });

    return NextResponse.json({ plans });
  } catch (error) {
    console.error('Get training plans error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch training plans' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'TRAINER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string;
    const title = formData.get('title') as string;
    const targetDate = formData.get('targetDate') as string | null;

    // Validation
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!category || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'uploads', 'training-plans');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFileName = `${timestamp}-${sanitizedFileName}`;
    const filePath = join(uploadsDir, uniqueFileName);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Save to database
    const trainingPlan = await prisma.trainingPlan.create({
      data: {
        category,
        title,
        targetDate: targetDate || null,
        filePath: `/uploads/training-plans/${uniqueFileName}`,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        uploadedBy: session.user.id,
        version: 1,
        isActive: true,
      },
    });

    // TODO: Send email notification to athletes

    return NextResponse.json({
      success: true,
      plan: trainingPlan,
    });
  } catch (error) {
    console.error('Upload training plan error:', error);
    return NextResponse.json(
      { error: 'Failed to upload training plan' },
      { status: 500 }
    );
  }
}