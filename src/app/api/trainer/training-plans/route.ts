// src/app/api/trainer/training-plans/route.ts
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

    if (!session || session.user.role !== 'TRAINER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string;
    const title = formData.get('title') as string;
    const targetDate = formData.get('targetDate') as string | null;

    if (!file || !category || !title) {
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

    // Validate category
    const validCategories = [
      'strength_goals',
      'strength_exercises',
      'flexibility_goals',
      'flexibility_exercises',
    ];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'uploads', 'training-plans');
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
    const trainingPlan = await prisma.trainingPlan.create({
      data: {
        title,
        category,
        filePath: `/uploads/training-plans/${filename}`,
        targetDate: targetDate ? new Date(targetDate) : null,
        uploadedBy: session.user.id,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPLOAD_TRAINING_PLAN',
        entityType: 'TRAINING_PLAN',
        entityId: trainingPlan.id,
        details: {
          title,
          category,
          filename,
          targetDate,
        },
      },
    });

    // Get all approved athletes' emails
    const approvedAthletes = await prisma.user.findMany({
      where: {
        role: 'ATHLETE',
        isApproved: true,
      },
      select: {
        email: true,
        name: true,
      },
    });

    // Send notification emails to all approved athletes
    if (approvedAthletes.length > 0) {
      try {
        await sendTrainingPlanUploadedEmail({
          athleteEmails: approvedAthletes,
          category,
          title,
          targetDate,
        });
        console.log(`✅ Training plan emails sent to ${approvedAthletes.length} athletes`);
      } catch (emailError) {
        console.error('❌ Failed to send training plan emails:', emailError);
      }
    }

    return NextResponse.json({
      message: 'Training plan uploaded successfully',
      trainingPlan,
    });
  } catch (error) {
    console.error('Error uploading training plan:', error);
    return NextResponse.json(
      { error: 'Failed to upload training plan' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'TRAINER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const trainingPlans = await prisma.trainingPlan.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        uploadedByTrainer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ trainingPlans });
  } catch (error) {
    console.error('Error fetching training plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch training plans' },
      { status: 500 }
    );
  }
}