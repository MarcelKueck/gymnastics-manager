import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'TRAINER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const athleteId = params.id;

    // Get athlete info
    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId, isApproved: true },
      select: {
        firstName: true,
        lastName: true,
      },
    });

    if (!athlete) {
      return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
    }

    // Get all attendance records with session details
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: { athleteId },
      include: {
        trainingSession: {
          select: {
            id: true,
            date: true,
            dayOfWeek: true,
            hourNumber: true,
            groupNumber: true,
            cancellations: {
              where: {
                athleteId,
                isActive: true,
              },
              select: {
                reason: true,
              },
            },
          },
        },
        markedByTrainer: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        trainingSession: {
          date: 'desc',
        },
      },
    });

    const records = attendanceRecords.map((record) => ({
      id: record.id,
      date: record.trainingSession.date,
      dayOfWeek: record.trainingSession.dayOfWeek,
      hourNumber: record.trainingSession.hourNumber,
      groupNumber: record.trainingSession.groupNumber,
      status: record.status,
      cancellationReason: record.trainingSession.cancellations[0]?.reason,
      markedBy: `${record.markedByTrainer.firstName} ${record.markedByTrainer.lastName}`,
      markedAt: record.markedAt,
      lastModifiedBy: record.lastModifiedBy,
      lastModifiedAt: record.lastModifiedAt,
    }));

    return NextResponse.json({ athlete, records });
  } catch (error) {
    console.error('Get attendance history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance history' },
      { status: 500 }
    );
  }
}