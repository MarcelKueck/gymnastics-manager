import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST assign trainers to recurring training
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { trainerIds, effectiveFrom, effectiveUntil } = body;

    if (!trainerIds || !Array.isArray(trainerIds) || trainerIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one trainer is required' },
        { status: 400 }
      );
    }

    if (trainerIds.length > 2) {
      return NextResponse.json(
        { error: 'Maximum of 2 trainers allowed' },
        { status: 400 }
      );
    }

    // Check if recurring training exists
    const recurringTraining = await prisma.recurringTraining.findUnique({
      where: { id },
    });

    if (!recurringTraining) {
      return NextResponse.json(
        { error: 'Recurring training not found' },
        { status: 404 }
      );
    }

    // Remove existing assignments (we'll replace them)
    await prisma.recurringTrainingTrainerAssignment.deleteMany({
      where: { recurringTrainingId: id },
    });

    // Create new assignments
    const assignments = await Promise.all(
      trainerIds.map((trainerId: string, index: number) =>
        prisma.recurringTrainingTrainerAssignment.create({
          data: {
            recurringTrainingId: id,
            trainerId,
            isPrimary: index === 0, // First trainer is primary
            effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : null,
            effectiveUntil: effectiveUntil ? new Date(effectiveUntil) : null,
            assignedBy: session.user.id,
          },
        })
      )
    );

    return NextResponse.json({
      message: 'Trainers assigned successfully',
      assignments,
    });
  } catch (error) {
    console.error('Error assigning trainers:', error);
    return NextResponse.json(
      { error: 'Failed to assign trainers' },
      { status: 500 }
    );
  }
}

// DELETE remove trainer from recurring training
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const trainerId = searchParams.get('trainerId');

    if (!trainerId) {
      return NextResponse.json(
        { error: 'trainerId is required' },
        { status: 400 }
      );
    }

    await prisma.recurringTrainingTrainerAssignment.delete({
      where: {
        recurringTrainingId_trainerId: {
          recurringTrainingId: id,
          trainerId,
        },
      },
    });

    return NextResponse.json({
      message: 'Trainer removed successfully',
    });
  } catch (error) {
    console.error('Error removing trainer:', error);
    return NextResponse.json(
      { error: 'Failed to remove trainer' },
      { status: 500 }
    );
  }
}
