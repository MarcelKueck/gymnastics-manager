import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// DELETE - Undo cancellation (before session date)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'ATHLETE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const athleteId = session.user.id;
    const cancellationId = params.id;

    // Get cancellation with session info
    const cancellation = await prisma.cancellation.findUnique({
      where: { id: cancellationId },
      include: {
        trainingSession: true,
      },
    });

    if (!cancellation) {
      return NextResponse.json(
        { error: 'Cancellation not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (cancellation.athleteId !== athleteId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Cannot undo if session is in the past
    if (new Date(cancellation.trainingSession.date) < new Date()) {
      return NextResponse.json(
        { error: 'Cannot undo cancellation for past sessions' },
        { status: 400 }
      );
    }

    // Mark as inactive (undo)
    await prisma.cancellation.update({
      where: { id: cancellationId },
      data: {
        isActive: false,
        undoneAt: new Date(),
      },
    });

    return NextResponse.json({ message: 'Cancellation undone successfully' });
  } catch (error) {
    console.error('Undo cancellation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}