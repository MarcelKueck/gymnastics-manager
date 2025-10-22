import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET single recurring training
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const recurringTraining = await prisma.recurringTraining.findUnique({
      where: { id },
      include: {
        groups: {
          include: {
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
              },
            },
          },
        },
        _count: {
          select: {
            groups: true,
            sessions: true,
          },
        },
      },
    });

    if (!recurringTraining) {
      return NextResponse.json(
        { error: 'Recurring training not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ recurringTraining });
  } catch (error) {
    console.error('Error fetching recurring training:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recurring training' },
      { status: 500 }
    );
  }
}

// PUT update recurring training
export async function PUT(
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
    const {
      name,
      dayOfWeek,
      startTime,
      endTime,
      groupNumber,
      recurrenceInterval,
      startDate,
      endDate,
      isActive,
    } = body;

    const recurringTraining = await prisma.recurringTraining.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(dayOfWeek && { dayOfWeek }),
        ...(startTime && { startTime }),
        ...(endTime && { endTime }),
        ...(groupNumber && { groupNumber: parseInt(groupNumber) }),
        ...(recurrenceInterval && { recurrenceInterval }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        groups: {
          include: {
            _count: {
              select: {
                athleteAssignments: true,
                trainerAssignments: true,
              },
            },
          },
        },
        _count: {
          select: {
            groups: true,
            sessions: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Recurring training updated successfully',
      recurringTraining,
    });
  } catch (error) {
    console.error('Error updating recurring training:', error);
    return NextResponse.json(
      { error: 'Failed to update recurring training' },
      { status: 500 }
    );
  }
}

// DELETE recurring training
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

    // Delete the recurring training (cascade will handle related records)
    await prisma.recurringTraining.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Recurring training deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting recurring training:', error);
    return NextResponse.json(
      { error: 'Failed to delete recurring training' },
      { status: 500 }
    );
  }
}
