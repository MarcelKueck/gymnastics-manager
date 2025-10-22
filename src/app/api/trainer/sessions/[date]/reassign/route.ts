import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only trainers and admins can reassign athletes
    if (session.user.role !== 'TRAINER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { sessionGroupId, athleteId, reason } = body;

    if (!sessionGroupId || !athleteId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the session group to find the session
    const sessionGroup = await prisma.sessionGroup.findUnique({
      where: { id: sessionGroupId },
      include: {
        trainingSession: true,
      },
    });

    if (!sessionGroup) {
      return NextResponse.json(
        { error: 'Session group not found' },
        { status: 404 }
      );
    }

    // Check if there's already a reassignment for this athlete in this session
    const existingReassignment = await prisma.sessionAthleteAssignment.findUnique({
      where: {
        trainingSessionId_athleteId: {
          trainingSessionId: sessionGroup.trainingSessionId,
          athleteId,
        },
      },
    });

    if (existingReassignment) {
      // Update existing reassignment to the new group
      await prisma.sessionAthleteAssignment.update({
        where: {
          id: existingReassignment.id,
        },
        data: {
          sessionGroupId,
          movedBy: session.user.id,
          movedAt: new Date(),
          reason: reason || null,
        },
      });
    } else {
      // Create new reassignment
      await prisma.sessionAthleteAssignment.create({
        data: {
          trainingSessionId: sessionGroup.trainingSessionId,
          sessionGroupId,
          athleteId,
          movedBy: session.user.id,
          reason: reason || null,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reassigning athlete:', error);
    return NextResponse.json(
      { error: 'Failed to reassign athlete' },
      { status: 500 }
    );
  }
}
