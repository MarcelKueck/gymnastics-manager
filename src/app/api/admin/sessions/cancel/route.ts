import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST cancel training sessions
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionIds, reason, cancelFutureSessions = false, recurringTrainingId } = body;

    if ((!sessionIds || !Array.isArray(sessionIds) || sessionIds.length === 0) && !cancelFutureSessions) {
      return NextResponse.json(
        { error: 'sessionIds array is required or cancelFutureSessions must be true' },
        { status: 400 }
      );
    }

    if (!reason || reason.trim().length < 10) {
      return NextResponse.json(
        { error: 'Cancellation reason must be at least 10 characters' },
        { status: 400 }
      );
    }

    let sessionsToCancel = [];

    if (cancelFutureSessions && recurringTrainingId) {
      // Cancel all future sessions for this recurring training
      const futureSessions = await prisma.trainingSession.findMany({
        where: {
          recurringTrainingId,
          date: {
            gte: new Date(),
          },
          isCancelled: false,
        },
      });
      sessionsToCancel = futureSessions.map((s) => s.id);
    } else {
      sessionsToCancel = sessionIds;
    }

    // Cancel all selected sessions
    const updatedSessions = await Promise.all(
      sessionsToCancel.map((sessionId: string) =>
        prisma.trainingSession.update({
          where: { id: sessionId },
          data: {
            isCancelled: true,
            cancelledBy: session.user.id,
            cancelledAt: new Date(),
            cancellationReason: reason,
          },
        })
      )
    );

    return NextResponse.json({
      message: `${updatedSessions.length} session(s) cancelled successfully`,
      cancelledCount: updatedSessions.length,
    });
  } catch (error) {
    console.error('Error cancelling sessions:', error);
    return NextResponse.json(
      { error: 'Failed to cancel sessions' },
      { status: 500 }
    );
  }
}

// PUT uncancel/restore training sessions
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionIds } = body;

    if (!sessionIds || !Array.isArray(sessionIds) || sessionIds.length === 0) {
      return NextResponse.json(
        { error: 'sessionIds array is required' },
        { status: 400 }
      );
    }

    // Restore cancelled sessions
    const updatedSessions = await Promise.all(
      sessionIds.map((sessionId: string) =>
        prisma.trainingSession.update({
          where: { id: sessionId },
          data: {
            isCancelled: false,
            cancelledBy: null,
            cancelledAt: null,
            cancellationReason: null,
          },
        })
      )
    );

    return NextResponse.json({
      message: `${updatedSessions.length} session(s) restored successfully`,
      restoredCount: updatedSessions.length,
    });
  } catch (error) {
    console.error('Error restoring sessions:', error);
    return NextResponse.json(
      { error: 'Failed to restore sessions' },
      { status: 500 }
    );
  }
}
