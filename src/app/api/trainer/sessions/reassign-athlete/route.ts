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
    const { athleteId, fromSessionGroupId, toSessionGroupId, trainingSessionId, reason } = body;

    if (!athleteId || !toSessionGroupId || !trainingSessionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // If moving from a group, remove the old assignment (if it exists)
    if (fromSessionGroupId) {
      await prisma.sessionAthleteAssignment.deleteMany({
        where: {
          athleteId,
          sessionGroupId: fromSessionGroupId,
        },
      });
    }

    // Check if there's already an assignment to the target group
    const existingAssignment = await prisma.sessionAthleteAssignment.findFirst({
      where: {
        athleteId,
        sessionGroupId: toSessionGroupId,
      },
    });

    if (existingAssignment) {
      return NextResponse.json({
        message: 'Athlete already assigned to this group',
      });
    }

    // Create the new assignment
    const assignment = await prisma.sessionAthleteAssignment.create({
      data: {
        trainingSessionId,
        athleteId,
        sessionGroupId: toSessionGroupId,
        reason: reason || 'Reassigned by trainer',
        movedBy: session.user.id,
      },
      include: {
        athlete: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            birthDate: true,
          },
        },
        sessionGroup: {
          include: {
            trainingGroup: true,
          },
        },
      },
    });

    return NextResponse.json(assignment);
  } catch (error) {
    console.error('Error reassigning athlete:', error);
    return NextResponse.json(
      { error: 'Failed to reassign athlete' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only trainers and admins can remove reassignments
    if (session.user.role !== 'TRAINER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { athleteId, sessionGroupId } = body;

    if (!athleteId || !sessionGroupId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Remove the session-specific assignment
    await prisma.sessionAthleteAssignment.deleteMany({
      where: {
        athleteId,
        sessionGroupId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing athlete reassignment:', error);
    return NextResponse.json(
      { error: 'Failed to remove athlete reassignment' },
      { status: 500 }
    );
  }
}
