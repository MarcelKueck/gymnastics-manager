import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';

// GET - Get trainers in group
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  const assignments = await prisma.recurringTrainingTrainerAssignment.findMany({
    where: { trainingGroupId: id },
    include: {
      trainer: { include: { user: true } },
    },
  });

  return NextResponse.json({
    data: assignments.map((a) => ({
      id: a.trainer.id,
      firstName: a.trainer.user.firstName,
      lastName: a.trainer.user.lastName,
      email: a.trainer.user.email,
      isPrimary: a.isPrimary,
    })),
  });
}

// POST - Add trainer to group
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const adminId = session!.user.trainerProfileId!;
  const { id } = await params;
  const { trainerId, isPrimary } = await request.json();

  await prisma.recurringTrainingTrainerAssignment.create({
    data: {
      trainingGroupId: id,
      trainerId,
      isPrimary: isPrimary || false,
      assignedBy: adminId,
    },
  });

  return NextResponse.json({
    message: 'Trainer hinzugefügt',
  });
}

// DELETE - Remove trainer from group
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const { trainerId } = await request.json();

  await prisma.recurringTrainingTrainerAssignment.delete({
    where: {
      trainingGroupId_trainerId: {
        trainingGroupId: id,
        trainerId,
      },
    },
  });

  return NextResponse.json({
    message: 'Trainer erfolgreich entfernt',
  });
}
