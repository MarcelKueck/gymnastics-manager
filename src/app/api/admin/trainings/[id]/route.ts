import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';

// GET - Get training details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  const training = await prisma.recurringTraining.findUnique({
    where: { id },
    include: {
      trainingGroups: {
        include: {
          athleteAssignments: {
            include: {
              athlete: { include: { user: true } },
            },
          },
          trainerAssignments: {
            include: {
              trainer: { include: { user: true } },
            },
          },
        },
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  if (!training) {
    return NextResponse.json(
      { error: 'Training nicht gefunden' },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: training });
}

// PUT - Update training
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();

  const training = await prisma.recurringTraining.update({
    where: { id },
    data: {
      name: body.name,
      dayOfWeek: body.dayOfWeek,
      startTime: body.startTime,
      endTime: body.endTime,
      recurrence: body.recurrence,
      isActive: body.isActive,
      validFrom: body.validFrom ? new Date(body.validFrom) : null,
      validUntil: body.validUntil ? new Date(body.validUntil) : null,
    },
  });

  return NextResponse.json({
    data: training,
    message: 'Training erfolgreich aktualisiert',
  });
}

// DELETE - Delete training (cascades to groups, sessions)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  await prisma.recurringTraining.delete({
    where: { id },
  });

  return NextResponse.json({
    message: 'Training erfolgreich gelöscht',
  });
}
