import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { unlink } from 'fs/promises';
import { join } from 'path';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'TRAINER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const planId = params.id;

    // Get plan details
    const plan = await prisma.trainingPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Delete file from filesystem
    try {
      const fullPath = join(process.cwd(), plan.filePath);
      await unlink(fullPath);
    } catch (fileError) {
      console.error('Error deleting file:', fileError);
      // Continue even if file deletion fails
    }

    // Delete from database
    await prisma.trainingPlan.delete({
      where: { id: planId },
    });

    return NextResponse.json({
      success: true,
      message: 'Training plan deleted',
    });
  } catch (error) {
    console.error('Delete training plan error:', error);
    return NextResponse.json(
      { error: 'Failed to delete training plan' },
      { status: 500 }
    );
  }
}