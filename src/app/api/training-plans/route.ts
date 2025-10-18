import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all active training plans (available to all authenticated users)
    const plans = await prisma.trainingPlan.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        category: true,
        title: true,
        targetDate: true,
        fileName: true,
        fileSize: true,
        uploadedAt: true,
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