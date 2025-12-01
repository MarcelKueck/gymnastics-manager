import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';

// GET - Get athletes in group
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  const assignments = await prisma.recurringTrainingAthleteAssignment.findMany({
    where: { trainingGroupId: id },
    include: {
      athlete: { include: { user: true } },
    },
  });

  return NextResponse.json({
    data: assignments.map((a) => ({
      id: a.athlete.id,
      firstName: a.athlete.user.firstName,
      lastName: a.athlete.user.lastName,
      email: a.athlete.user.email,
      youthCategory: a.athlete.youthCategory,
      assignedAt: a.assignedAt,
    })),
  });
}

// POST - Add athletes to group
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const trainerId = session!.user.trainerProfileId!;
  const { id } = await params;
  const { athleteIds } = await request.json();

  if (!Array.isArray(athleteIds) || athleteIds.length === 0) {
    return NextResponse.json(
      { error: 'Athleten-IDs erforderlich' },
      { status: 400 }
    );
  }

  // Create assignments (skip existing)
  const results = await Promise.allSettled(
    athleteIds.map((athleteId: string) =>
      prisma.recurringTrainingAthleteAssignment.create({
        data: {
          trainingGroupId: id,
          athleteId,
          assignedBy: trainerId,
        },
      })
    )
  );

  const created = results.filter((r) => r.status === 'fulfilled').length;

  return NextResponse.json({
    message: `${created} Athlet(en) hinzugefügt`,
  });
}

// DELETE - Remove athlete from group
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const { athleteId } = await request.json();

  await prisma.recurringTrainingAthleteAssignment.delete({
    where: {
      trainingGroupId_athleteId: {
        trainingGroupId: id,
        athleteId,
      },
    },
  });

  return NextResponse.json({
    message: 'Athlet erfolgreich entfernt',
  });
}
