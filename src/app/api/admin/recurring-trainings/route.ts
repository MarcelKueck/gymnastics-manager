import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET all recurring trainings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const recurringTrainings = await prisma.recurringTraining.findMany({
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
            sessions: true,
          },
        },
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' },
        { groupNumber: 'asc' },
      ],
    });

    return NextResponse.json({ recurringTrainings });
  } catch (error) {
    console.error('Error fetching recurring trainings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recurring trainings' },
      { status: 500 }
    );
  }
}

// POST create new recurring training
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    } = body;

    // Validation
    if (!name || !dayOfWeek || !startTime || !endTime || !groupNumber || !startDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const recurringTraining = await prisma.recurringTraining.create({
      data: {
        name,
        dayOfWeek,
        startTime,
        endTime,
        groupNumber: parseInt(groupNumber),
        recurrenceInterval: recurrenceInterval || 'WEEKLY',
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        createdBy: session.user.id,
      },
      include: {
        athleteAssignments: true,
        trainerAssignments: true,
      },
    });

    return NextResponse.json({
      message: 'Recurring training created successfully',
      recurringTraining,
    });
  } catch (error) {
    console.error('Error creating recurring training:', error);
    return NextResponse.json(
      { error: 'Failed to create recurring training' },
      { status: 500 }
    );
  }
}
