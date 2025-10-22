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
    const { trainerIds, trainingGroupId, effectiveFrom, effectiveUntil } = body;

    if (!trainerIds || !Array.isArray(trainerIds) || trainerIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one trainer is required' },
        { status: 400 }
      );
    }

    if (!trainingGroupId) {
      return NextResponse.json(
        { error: 'trainingGroupId is required' },
        { status: 400 }
      );
    }

    // Check if training group exists and belongs to this recurring training
    const trainingGroup = await prisma.trainingGroup.findFirst({
      where: {
        id: trainingGroupId,
        recurringTrainingId: id,
      },
    });

    if (!trainingGroup) {
      return NextResponse.json(
        { error: 'Training group not found' },
        { status: 404 }
      );
    }

    // Remove existing assignments for this group (we'll replace them)
    await prisma.recurringTrainingTrainerAssignment.deleteMany({
      where: { trainingGroupId },
    });

    // Create new assignments
    const assignments = await Promise.all(
      trainerIds.map((trainerId: string, index: number) =>
        prisma.recurringTrainingTrainerAssignment.create({
          data: {
            trainingGroupId,
            trainerId,
            isPrimary: index === 0, // First trainer is primary
            effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : null,
            effectiveUntil: effectiveUntil ? new Date(effectiveUntil) : null,
            assignedBy: session.user.id,
          },
          include: {
            trainer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
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
    const trainingGroupId = searchParams.get('trainingGroupId');

    if (!trainerId) {
      return NextResponse.json(
        { error: 'trainerId is required' },
        { status: 400 }
      );
    }

    if (!trainingGroupId) {
      return NextResponse.json(
        { error: 'trainingGroupId is required' },
        { status: 400 }
      );
    }

    // Verify the assignment exists and belongs to this recurring training
    const assignment = await prisma.recurringTrainingTrainerAssignment.findFirst({
      where: {
        trainingGroupId,
        trainerId,
        trainingGroup: {
          recurringTrainingId: id,
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    await prisma.recurringTrainingTrainerAssignment.delete({
      where: {
        id: assignment.id,
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
