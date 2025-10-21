import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Only admins can approve trainers
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { trainerId } = body;

    if (!trainerId) {
      return NextResponse.json(
        { error: 'Trainer ID is required' },
        { status: 400 }
      );
    }

    // Find the trainer
    const trainer = await prisma.trainer.findUnique({
      where: { id: trainerId },
    });

    if (!trainer) {
      return NextResponse.json(
        { error: 'Trainer not found' },
        { status: 404 }
      );
    }

    if (trainer.isActive) {
      return NextResponse.json(
        { error: 'Trainer is already active' },
        { status: 400 }
      );
    }

    // Activate the trainer
    const updatedTrainer = await prisma.trainer.update({
      where: { id: trainerId },
      data: {
        isActive: true,
      },
    });

    // TODO: Send email notification to trainer about approval

    return NextResponse.json({
      message: 'Trainer approved successfully',
      trainer: {
        id: updatedTrainer.id,
        email: updatedTrainer.email,
        firstName: updatedTrainer.firstName,
        lastName: updatedTrainer.lastName,
      },
    });
  } catch (error) {
    console.error('Approve trainer error:', error);
    return NextResponse.json(
      { error: 'Failed to approve trainer' },
      { status: 500 }
    );
  }
}
