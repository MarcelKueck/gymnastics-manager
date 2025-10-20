import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'ATHLETE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const athleteId = session.user.id;

    // Get all attendance records
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: { athleteId },
      include: {
        trainingSession: {
          select: {
            date: true,
            dayOfWeek: true,
            hourNumber: true,
            groupNumber: true,
          },
        },
      },
      orderBy: { trainingSession: { date: 'desc' } },
    });

    // Calculate statistics
    const totalSessions = attendanceRecords.length;
    const presentSessions = attendanceRecords.filter(
      (record) => record.status === 'PRESENT'
    ).length;
    const excusedAbsences = attendanceRecords.filter(
      (record) => record.status === 'ABSENT_EXCUSED'
    ).length;
    const unexcusedAbsences = attendanceRecords.filter(
      (record) => record.status === 'ABSENT_UNEXCUSED'
    ).length;

    const attendancePercentage =
      totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0;
    const excusedPercentage =
      totalSessions > 0 ? Math.round((excusedAbsences / totalSessions) * 100) : 0;

    // Get cancellations to show reasons
    const cancellations = await prisma.cancellation.findMany({
      where: { 
        athleteId,
        isActive: true,
      },
      select: {
        trainingSessionId: true,
        reason: true,
      },
    });

    // Map cancellations by session ID
    const cancellationMap = new Map(
      cancellations.map((c) => [c.trainingSessionId, c.reason])
    );

    // Attach cancellation reasons to attendance records
    const recordsWithReasons = attendanceRecords.map((record) => ({
      ...record,
      cancellationReason: cancellationMap.get(record.trainingSessionId) || null,
    }));

    return NextResponse.json({
      records: recordsWithReasons,
      statistics: {
        totalSessions,
        presentSessions,
        excusedAbsences,
        unexcusedAbsences,
        attendancePercentage,
        excusedPercentage,
      },
    });
  } catch (error) {
    console.error('Attendance API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}