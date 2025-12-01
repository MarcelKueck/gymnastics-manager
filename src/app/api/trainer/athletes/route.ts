import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    }

    if (session.user.activeRole !== 'TRAINER' && session.user.activeRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 });
    }

    // Check for status filter
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status')?.toUpperCase();

    const whereClause = statusFilter && ['PENDING', 'ACTIVE', 'INACTIVE'].includes(statusFilter)
      ? { status: statusFilter as 'PENDING' | 'ACTIVE' | 'INACTIVE' }
      : {};

    const athletes = await prisma.athleteProfile.findMany({
      where: whereClause,
      include: {
        user: true,
        recurringTrainingAssignments: {
          include: {
            trainingGroup: true,
          },
        },
        attendanceRecords: {
          where: {
            markedAt: {
              gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
            },
          },
        },
      },
      orderBy: {
        user: {
          lastName: 'asc',
        },
      },
    });

    const data = athletes.map((athlete) => {
      // Calculate attendance rate
      const totalRecords = athlete.attendanceRecords.length;
      const presentRecords = athlete.attendanceRecords.filter(
        (r) => r.status === 'PRESENT'
      ).length;
      const attendanceRate = totalRecords > 0
        ? Math.round((presentRecords / totalRecords) * 100)
        : undefined;

      return {
        id: athlete.id,
        name: `${athlete.user.firstName} ${athlete.user.lastName}`,
        email: athlete.user.email,
        status: athlete.status,
        groups: athlete.recurringTrainingAssignments.map((a) => a.trainingGroup.name),
        youthCategory: athlete.youthCategory,
        joinedAt: athlete.createdAt.toISOString(),
        attendanceRate,
      };
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Athletes API error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Athleten' },
      { status: 500 }
    );
  }
}
