import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';

// DELETE - Deactivate an absence period
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  const absencePeriod = await prisma.absencePeriod.findUnique({
    where: { id },
  });

  if (!absencePeriod) {
    return NextResponse.json(
      { error: 'Abwesenheitszeitraum nicht gefunden' },
      { status: 404 }
    );
  }

  await prisma.absencePeriod.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({
    success: true,
    message: 'Abwesenheitszeitraum deaktiviert',
  });
}

// PUT - Update an absence period
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const { startDate, endDate, reason, notes, isActive } = body;

  const absencePeriod = await prisma.absencePeriod.findUnique({
    where: { id },
  });

  if (!absencePeriod) {
    return NextResponse.json(
      { error: 'Abwesenheitszeitraum nicht gefunden' },
      { status: 404 }
    );
  }

  const updateData: {
    startDate?: Date;
    endDate?: Date;
    reason?: string;
    notes?: string | null;
    isActive?: boolean;
  } = {};

  if (startDate) updateData.startDate = new Date(startDate);
  if (endDate) updateData.endDate = new Date(endDate);
  if (reason) updateData.reason = reason.trim();
  if (notes !== undefined) updateData.notes = notes?.trim() || null;
  if (isActive !== undefined) updateData.isActive = isActive;

  const updated = await prisma.absencePeriod.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({
    success: true,
    message: 'Abwesenheitszeitraum aktualisiert',
    data: updated,
  });
}
