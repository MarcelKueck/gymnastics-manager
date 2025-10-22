import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET a specific training group
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { groupId } = await params;

    const group = await prisma.trainingGroup.findUnique({
      where: { id: groupId },
      include: {
        recurringTraining: true,
        athleteAssignments: {
          include: {
            athlete: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                birthDate: true,
                email: true,
              },
            },
          },
        },
        trainerAssignments: {
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
        },
        _count: {
          select: {
            athleteAssignments: true,
            trainerAssignments: true,
            sessionGroups: true,
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json(
        { error: 'Training group not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(group);
  } catch (error) {
    console.error('Error fetching training group:', error);
    return NextResponse.json(
      { error: 'Failed to fetch training group' },
      { status: 500 }
    );
  }
}

// PUT update a training group
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, groupId } = await params;
    const body = await request.json();
    const { name, description, sortOrder } = body;

    // Check if group exists and belongs to this recurring training
    const existingGroup = await prisma.trainingGroup.findFirst({
      where: {
        id: groupId,
        recurringTrainingId: id,
      },
    });

    if (!existingGroup) {
      return NextResponse.json(
        { error: 'Training group not found' },
        { status: 404 }
      );
    }

    // If name is being changed, check for duplicates
    if (name && name.trim() !== existingGroup.name) {
      const duplicateGroup = await prisma.trainingGroup.findFirst({
        where: {
          recurringTrainingId: id,
          name: name.trim(),
          id: {
            not: groupId,
          },
        },
      });

      if (duplicateGroup) {
        return NextResponse.json(
          { error: 'A group with this name already exists for this training' },
          { status: 400 }
        );
      }
    }

    const updatedGroup = await prisma.trainingGroup.update({
      where: { id: groupId },
      data: {
        name: name?.trim() || existingGroup.name,
        description: description !== undefined ? (description?.trim() || null) : existingGroup.description,
        sortOrder: sortOrder !== undefined ? sortOrder : existingGroup.sortOrder,
      },
      include: {
        _count: {
          select: {
            athleteAssignments: true,
            trainerAssignments: true,
          },
        },
      },
    });

    return NextResponse.json(updatedGroup);
  } catch (error) {
    console.error('Error updating training group:', error);
    return NextResponse.json(
      { error: 'Failed to update training group' },
      { status: 500 }
    );
  }
}

// DELETE a training group
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, groupId } = await params;

    // Check if group exists and belongs to this recurring training
    const group = await prisma.trainingGroup.findFirst({
      where: {
        id: groupId,
        recurringTrainingId: id,
      },
      include: {
        _count: {
          select: {
            athleteAssignments: true,
            trainerAssignments: true,
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json(
        { error: 'Training group not found' },
        { status: 404 }
      );
    }

    // Check if group has assignments
    if (group._count.athleteAssignments > 0 || group._count.trainerAssignments > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete group with assigned athletes or trainers. Please reassign them first.',
          athleteCount: group._count.athleteAssignments,
          trainerCount: group._count.trainerAssignments,
        },
        { status: 400 }
      );
    }

    // Delete the group (SessionGroups will be cascade deleted)
    await prisma.trainingGroup.delete({
      where: { id: groupId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting training group:', error);
    return NextResponse.json(
      { error: 'Failed to delete training group' },
      { status: 500 }
    );
  }
}
