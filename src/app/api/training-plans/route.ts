import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get all active training plans (available to all authenticated users)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all active training plans grouped by category
    const trainingPlans = await prisma.trainingPlan.findMany({
      where: { isActive: true },
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

    // Group by category
    const groupedPlans = {
      STRENGTH_GOALS: trainingPlans.filter((p) => p.category === 'STRENGTH_GOALS'),
      STRENGTH_EXERCISES: trainingPlans.filter((p) => p.category === 'STRENGTH_EXERCISES'),
      STRETCHING_GOALS: trainingPlans.filter((p) => p.category === 'STRETCHING_GOALS'),
      STRETCHING_EXERCISES: trainingPlans.filter((p) => p.category === 'STRETCHING_EXERCISES'),
    };

    return NextResponse.json({ plans: groupedPlans });
  } catch (error) {
    console.error('Training plans API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}