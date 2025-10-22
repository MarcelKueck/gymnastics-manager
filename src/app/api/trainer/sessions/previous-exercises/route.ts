import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only trainers and admins can access this
    if (session.user.role !== 'TRAINER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');

    if (!dateStr) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    // Parse the previous week date
    const previousDate = new Date(dateStr);
    const startOfDay = new Date(previousDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(previousDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Find all sessions from the previous week
    const previousSessions = await prisma.trainingSession.findMany({
      where: {
        date: {
          gte: startOfDay,
          lt: endOfDay,
        },
        isCancelled: false,
      },
      include: {
        groups: {
          select: {
            id: true,
            trainingGroupId: true,
            exercises: true,
            notes: true,
          },
        },
      },
    });

    if (previousSessions.length === 0) {
      return NextResponse.json({
        sessionGroups: [],
        message: 'No exercises found from previous week',
      });
    }

    // Flatten all session groups
    const sessionGroups = previousSessions.flatMap((session) => session.groups);

    return NextResponse.json({
      sessionGroups,
    });
  } catch (error) {
    console.error('Error fetching previous exercises:', error);
    return NextResponse.json(
      { error: 'Failed to fetch previous exercises' },
      { status: 500 }
    );
  }
}
