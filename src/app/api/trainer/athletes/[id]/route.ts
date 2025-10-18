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

    const athlete = await prisma.athlete.findUnique({
      where: {
        id: athleteId,
        isApproved: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        birthDate: true,
        gender: true,
        phone: true,
        guardianName: true,
        guardianEmail: true,
        guardianPhone: true,
        emergencyContactName: true,
        emergencyContactPhone: true,
        youthCategory: true,
        competitionParticipation: true,
        approvedAt: true,
        configuredAt: true,
        groupAssignments: {
          where: {
            isActive: true,
          },
          select: {
            id: true,
            groupNumber: true,
            trainingDay: true,
            hourNumber: true,
          },
        },
        attendanceRecords: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!athlete) {
      return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
    }

    // Calculate attendance stats
    const totalSessions = athlete.attendanceRecords.length;
    const attended = athlete.attendanceRecords.filter((r) => r.status === 'PRESENT').length;
    const excusedAbsences = athlete.attendanceRecords.filter(
      (r) => r.status === 'ABSENT_EXCUSED'
    ).length;
    const unexcusedAbsences = athlete.attendanceRecords.filter(
      (r) => r.status === 'ABSENT_UNEXCUSED'
    ).length;

    const attendancePercentage =
      totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 0;

    const athleteWithStats = {
      ...athlete,
      attendanceStats: {
        totalSessions,
        attended,
        attendancePercentage,
        excusedAbsences,
        unexcusedAbsences,
      },
    };

    // Remove the raw attendanceRecords array since we've calculated stats
    const { attendanceRecords, ...athleteData } = athleteWithStats;

    return NextResponse.json({ athlete: athleteData });
  } catch (error) {
    console.error('Get athlete detail error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch athlete details' },
      { status: 500 }
    );
  }
}