import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'TRAINER' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: athleteId } = await params;

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
        hasDtbId: true,
        approvedAt: true,
        configuredAt: true,
        recurringTrainingAssignments: {
          select: {
            id: true,
            trainingGroup: {
              select: {
                id: true,
                name: true,
                recurringTraining: {
                  select: {
                    id: true,
                    name: true,
                    dayOfWeek: true,
                    startTime: true,
                    endTime: true,
                  },
                },
              },
            },
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

    // Transform group assignments to include training and group information
    const groupAssignments = athlete.recurringTrainingAssignments.map((assignment) => ({
      id: assignment.id,
      trainingId: assignment.trainingGroup.recurringTraining.id,
      trainingName: assignment.trainingGroup.recurringTraining.name,
      groupId: assignment.trainingGroup.id,
      groupName: assignment.trainingGroup.name,
      trainingDay: assignment.trainingGroup.recurringTraining.dayOfWeek,
      startTime: assignment.trainingGroup.recurringTraining.startTime,
      endTime: assignment.trainingGroup.recurringTraining.endTime,
    }));

    const athleteWithStats = {
      id: athlete.id,
      email: athlete.email,
      firstName: athlete.firstName,
      lastName: athlete.lastName,
      birthDate: athlete.birthDate,
      gender: athlete.gender,
      phone: athlete.phone,
      guardianName: athlete.guardianName,
      guardianEmail: athlete.guardianEmail,
      guardianPhone: athlete.guardianPhone,
      emergencyContactName: athlete.emergencyContactName,
      emergencyContactPhone: athlete.emergencyContactPhone,
      youthCategory: athlete.youthCategory,
      competitionParticipation: athlete.competitionParticipation,
      hasDtbId: athlete.hasDtbId,
      approvedAt: athlete.approvedAt,
      configuredAt: athlete.configuredAt,
      groupAssignments,
      attendanceStats: {
        totalSessions,
        attended,
        attendancePercentage,
        excusedAbsences,
        unexcusedAbsences,
      },
    };

    return NextResponse.json({ athlete: athleteWithStats });
  } catch (error) {
    console.error('Get athlete detail error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch athlete details' },
      { status: 500 }
    );
  }
}