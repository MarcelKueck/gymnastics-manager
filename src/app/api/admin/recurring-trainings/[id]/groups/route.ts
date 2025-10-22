import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET all groups for a recurring training
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const groups = await prisma.trainingGroup.findMany({
      where: {
        recurringTrainingId: id,
      },
      include: {
        athleteAssignments: {
          include: {
            athlete: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                birthDate: true,
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
              },
            },
          },
        },
        _count: {
          select: {
            athleteAssignments: true,
            trainerAssignments: true,
          },
        },
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });

    return NextResponse.json(groups);
  } catch (error) {
    console.error('Error fetching training groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch training groups' },
      { status: 500 }
    );
  }
}

// POST create a new group for a recurring training
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, sortOrder } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Group name is required' },
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

    // Check if group name already exists for this training
    const existingGroup = await prisma.trainingGroup.findFirst({
      where: {
        recurringTrainingId: id,
        name: name.trim(),
      },
    });

    if (existingGroup) {
      return NextResponse.json(
        { error: 'A group with this name already exists for this training' },
        { status: 400 }
      );
    }

    // If sortOrder not provided, set it to be last
    let finalSortOrder = sortOrder;
    if (finalSortOrder === undefined || finalSortOrder === null) {
      const maxSortOrder = await prisma.trainingGroup.findFirst({
        where: { recurringTrainingId: id },
        orderBy: { sortOrder: 'desc' },
        select: { sortOrder: true },
      });
      finalSortOrder = maxSortOrder ? maxSortOrder.sortOrder + 1 : 0;
    }

    const group = await prisma.trainingGroup.create({
      data: {
        recurringTrainingId: id,
        name: name.trim(),
        description: description?.trim() || null,
        sortOrder: finalSortOrder,
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

    // Create SessionGroups for all existing future sessions of this recurring training
    const futureSessions = await prisma.trainingSession.findMany({
      where: {
        recurringTrainingId: id,
        date: {
          gte: new Date(),
        },
      },
    });

    if (futureSessions.length > 0) {
      await prisma.sessionGroup.createMany({
        data: futureSessions.map((session) => ({
          trainingSessionId: session.id,
          trainingGroupId: group.id,
        })),
      });
    }

    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error('Error creating training group:', error);
    return NextResponse.json(
      { error: 'Failed to create training group' },
      { status: 500 }
    );
  }
}
