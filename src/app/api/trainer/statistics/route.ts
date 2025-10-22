import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get trainer statistics
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || (session.user.role !== 'TRAINER' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current year date range
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59);

    // Current year statistics
    const [sessionsConducted, attendanceMarked] = await Promise.all([
      // Count sessions conducted through SessionGroupTrainerAssignment
      prisma.sessionGroupTrainerAssignment.count({
        where: {
          trainerId: session.user.id,
          sessionGroup: {
            trainingSession: {
              date: { gte: yearStart, lte: yearEnd },
            },
          },
        },
      }),
      prisma.attendanceRecord.count({
        where: {
          markedBy: session.user.id,
          markedAt: { gte: yearStart, lte: yearEnd },
        },
      }),
    ]);

    // All time statistics
    const [totalApprovedAthletes, totalSessions, totalUploads] = await Promise.all([
      prisma.athlete.count({
        where: { approvedBy: session.user.id },
      }),
      // Count all sessions conducted
      prisma.sessionGroupTrainerAssignment.count({
        where: { trainerId: session.user.id },
      }),
      prisma.upload.count({
        where: { uploadedBy: session.user.id },
      }),
    ]);

    // Current status
    const athletesInGroupsData = await prisma.recurringTrainingAthleteAssignment.findMany({
      where: {
        trainingGroup: {
          trainerAssignments: {
            some: { trainerId: session.user.id },
          },
          recurringTraining: {
            isActive: true,
          },
        },
      },
      select: { athleteId: true },
      distinct: ['athleteId'],
    });

    const recurringTrainingAssignments = await prisma.recurringTrainingTrainerAssignment.count({
      where: {
        trainerId: session.user.id,
        trainingGroup: {
          recurringTraining: {
            isActive: true,
          },
        },
      },
    });

    const activeUploads = await prisma.upload.count({
      where: {
        uploadedBy: session.user.id,
        isActive: true,
      },
    });

    // Get top athletes by attendance rate (from trainer's assigned groups)
    const athletesInGroups = await prisma.recurringTrainingAthleteAssignment.findMany({
      where: {
        trainingGroup: {
          trainerAssignments: {
            some: { trainerId: session.user.id },
          },
          recurringTraining: {
            isActive: true,
          },
        },
      },
      select: {
        athlete: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      distinct: ['athleteId'],
    });

    // Calculate attendance rate for each athlete
    const topAthletesData = await Promise.all(
      athletesInGroups.slice(0, 10).map(async (assignment) => {
        const [sessionsAttended, totalSessions] = await Promise.all([
          prisma.attendanceRecord.count({
            where: {
              athleteId: assignment.athlete.id,
              status: 'PRESENT',
              markedAt: { gte: yearStart, lte: yearEnd },
            },
          }),
          prisma.attendanceRecord.count({
            where: {
              athleteId: assignment.athlete.id,
              markedAt: { gte: yearStart, lte: yearEnd },
            },
          }),
        ]);

        const attendanceRate = totalSessions > 0 
          ? Math.round((sessionsAttended / totalSessions) * 100)
          : 0;

        return {
          id: assignment.athlete.id,
          name: `${assignment.athlete.firstName} ${assignment.athlete.lastName}`,
          attendanceRate,
          sessionsAttended,
        };
      })
    );

    // Sort by attendance rate and take top 5
    const topAthletes = topAthletesData
      .sort((a, b) => b.attendanceRate - a.attendanceRate)
      .slice(0, 5);

    return NextResponse.json({
      currentYear: {
        sessionsConducted,
        attendanceMarked,
      },
      allTime: {
        totalApprovedAthletes,
        totalSessions,
        totalUploads,
      },
      current: {
        athletesInGroups: athletesInGroupsData.length,
        recurringTrainingAssignments,
        activeUploads,
      },
      topAthletes,
    });
  } catch (error) {
    console.error('Get trainer statistics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
