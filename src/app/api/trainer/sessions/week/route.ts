import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startOfWeek, endOfWeek, format } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'TRAINER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    
    if (!dateParam) {
      return NextResponse.json({ error: 'Date parameter required' }, { status: 400 });
    }

    const date = new Date(dateParam);
    const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(date, { weekStartsOn: 1 }); // Sunday

    // Get all sessions for the week
    const sessions = await prisma.trainingSession.findMany({
      where: {
        date: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
      include: {
        attendanceRecords: {
          select: {
            id: true,
            athleteId: true,
            status: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Group by date
    const sessionsByDate = sessions.reduce((acc, session) => {
      const dateKey = format(session.date, 'yyyy-MM-dd');
      
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          dayOfWeek: session.dayOfWeek,
          sessionsCount: 0,
          markedCount: 0,
          totalAthletes: 0,
        };
      }

      acc[dateKey].sessionsCount += 1;
      acc[dateKey].totalAthletes += session.attendanceRecords.length;
      acc[dateKey].markedCount += session.attendanceRecords.filter(
        (r) => r.status !== null
      ).length;

      return acc;
    }, {} as Record<string, any>);

    const sessionsSummary = Object.values(sessionsByDate);

    return NextResponse.json({ sessions: sessionsSummary });
  } catch (error) {
    console.error('Get week sessions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch week sessions' },
      { status: 500 }
    );
  }
}