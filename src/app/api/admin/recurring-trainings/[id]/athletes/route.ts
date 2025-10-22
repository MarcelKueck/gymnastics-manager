import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST assign athletes to recurring training
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'TRAINER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { athleteIds, trainingGroupId } = body;

    if (!athleteIds || !Array.isArray(athleteIds)) {
      return NextResponse.json(
        { error: 'athleteIds must be an array' },
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
      include: {
        recurringTraining: {
          include: {
            groups: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!trainingGroup) {
      return NextResponse.json(
        { error: 'Training group not found' },
        { status: 404 }
      );
    }

    // Validate: Athletes cannot be in multiple groups of the same recurring training
    const allGroupIds = trainingGroup.recurringTraining.groups.map(g => g.id);
    const conflicts = await prisma.recurringTrainingAthleteAssignment.findMany({
      where: {
        athleteId: {
          in: athleteIds,
        },
        trainingGroupId: {
          in: allGroupIds,
          not: trainingGroupId, // Exclude the target group
        },
      },
      include: {
        athlete: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        trainingGroup: {
          select: {
            name: true,
          },
        },
      },
    });

    if (conflicts.length > 0) {
      return NextResponse.json(
        {
          error: 'Some athletes are already assigned to other groups in this training',
          conflicts: conflicts.map(c => ({
            athleteName: `${c.athlete.firstName} ${c.athlete.lastName}`,
            existingGroup: c.trainingGroup.name,
          })),
        },
        { status: 400 }
      );
    }

    // Create assignments for each athlete
    const assignments = await Promise.all(
      athleteIds.map((athleteId: string) =>
        prisma.recurringTrainingAthleteAssignment.upsert({
          where: {
            trainingGroupId_athleteId: {
              trainingGroupId,
              athleteId,
            },
          },
          create: {
            trainingGroupId,
            athleteId,
            assignedBy: session.user.id,
          },
          update: {}, // Already exists, no update needed
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
        })
      )
    );

    return NextResponse.json({
      message: 'Athletes assigned successfully',
      assignments,
    });
  } catch (error) {
    console.error('Error assigning athletes:', error);
    return NextResponse.json(
      { error: 'Failed to assign athletes' },
      { status: 500 }
    );
  }
}

// DELETE remove athlete from recurring training
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'TRAINER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const athleteId = searchParams.get('athleteId');
    const trainingGroupId = searchParams.get('trainingGroupId');

    if (!athleteId) {
      return NextResponse.json(
        { error: 'athleteId is required' },
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
    const assignment = await prisma.recurringTrainingAthleteAssignment.findFirst({
      where: {
        trainingGroupId,
        athleteId,
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

    await prisma.recurringTrainingAthleteAssignment.delete({
      where: {
        id: assignment.id,
      },
    });

    return NextResponse.json({
      message: 'Athlete removed successfully',
    });
  } catch (error) {
    console.error('Error removing athlete:', error);
    return NextResponse.json(
      { error: 'Failed to remove athlete' },
      { status: 500 }
    );
  }
}
