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
    const { athleteIds } = body;

    if (!athleteIds || !Array.isArray(athleteIds)) {
      return NextResponse.json(
        { error: 'athleteIds must be an array' },
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

    // Create assignments for each athlete
    const assignments = await Promise.all(
      athleteIds.map((athleteId: string) =>
        prisma.recurringTrainingAthleteAssignment.upsert({
          where: {
            recurringTrainingId_athleteId: {
              recurringTrainingId: id,
              athleteId,
            },
          },
          create: {
            recurringTrainingId: id,
            athleteId,
            assignedBy: session.user.id,
          },
          update: {}, // Already exists, no update needed
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

    if (!athleteId) {
      return NextResponse.json(
        { error: 'athleteId is required' },
        { status: 400 }
      );
    }

    await prisma.recurringTrainingAthleteAssignment.delete({
      where: {
        recurringTrainingId_athleteId: {
          recurringTrainingId: id,
          athleteId,
        },
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
