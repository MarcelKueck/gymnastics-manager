import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';

// GET - Get group details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  const group = await prisma.trainingGroup.findUnique({
    where: { id },
    include: {
      recurringTraining: true,
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
  });

  if (!group) {
    return NextResponse.json(
      { error: 'Gruppe nicht gefunden' },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: group });
}

// PUT - Update group
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();

  const group = await prisma.trainingGroup.update({
    where: { id },
    data: {
      name: body.name,
      sortOrder: body.sortOrder,
    },
  });

  return NextResponse.json({
    data: group,
    message: 'Gruppe erfolgreich aktualisiert',
  });
}

// DELETE - Delete group
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  await prisma.trainingGroup.delete({
    where: { id },
  });

  return NextResponse.json({
    message: 'Gruppe erfolgreich gelöscht',
  });
}
