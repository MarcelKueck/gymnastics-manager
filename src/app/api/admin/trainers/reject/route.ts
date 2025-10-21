import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Only admins can reject trainers
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

    // Delete the trainer registration
    await prisma.trainer.delete({
      where: { id: trainerId },
    });

    // TODO: Send email notification to trainer about rejection

    return NextResponse.json({
      message: 'Trainer registration rejected',
    });
  } catch (error) {
    console.error('Reject trainer error:', error);
    return NextResponse.json(
      { error: 'Failed to reject trainer' },
      { status: 500 }
    );
  }
}
