import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'TRAINER' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all approved athletes with their group assignments and attendance stats
    const athletes = await prisma.athlete.findMany({
      where: {
        isApproved: true,
      },
      orderBy: {
        lastName: 'asc',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        birthDate: true,
        youthCategory: true,
        competitionParticipation: true,
        groupAssignments: {
          where: {
            isActive: true,
          },
          select: {
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

    // Calculate attendance stats for each athlete
    const athletesWithStats = athletes.map((athlete) => {
      const totalSessions = athlete.attendanceRecords.length;
      const attended = athlete.attendanceRecords.filter(
        (r) => r.status === 'PRESENT'
      ).length;
      const unexcusedAbsences = athlete.attendanceRecords.filter(
        (r) => r.status === 'ABSENT_UNEXCUSED'
      ).length;

      const attendancePercentage =
        totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 0;

      return {
        id: athlete.id,
        firstName: athlete.firstName,
        lastName: athlete.lastName,
        birthDate: athlete.birthDate,
        youthCategory: athlete.youthCategory,
        competitionParticipation: athlete.competitionParticipation,
        groupAssignments: athlete.groupAssignments,
        attendanceStats: {
          totalSessions,
          attended,
          attendancePercentage,
          unexcusedAbsences,
        },
      };
    });

    return NextResponse.json({ athletes: athletesWithStats });
  } catch (error) {
    console.error('Get athletes error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch athletes' },
      { status: 500 }
    );
  }
}