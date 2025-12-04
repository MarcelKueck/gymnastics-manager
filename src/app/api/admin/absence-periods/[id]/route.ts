import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get a specific absence period
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    }

    if (session.user.activeRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 });
    }

    const { id } = await params;

    const absencePeriod = await prisma.absencePeriod.findUnique({
      where: { id },
      include: {
        athlete: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        trainer: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    });

    if (!absencePeriod) {
      return NextResponse.json({ error: 'Abwesenheitszeitraum nicht gefunden' }, { status: 404 });
    }

    return NextResponse.json({ data: absencePeriod });
  } catch (error) {
    console.error('Absence period GET error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden des Abwesenheitszeitraums' },
      { status: 500 }
    );
  }
}

// PUT - Update an absence period
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    }

    if (session.user.activeRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const absencePeriod = await prisma.absencePeriod.update({
      where: { id },
      data: {
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        reason: body.reason,
        notes: body.notes,
        isActive: body.isActive,
      },
    });

    return NextResponse.json({
      data: absencePeriod,
      message: 'Abwesenheitszeitraum aktualisiert',
    });
  } catch (error) {
    console.error('Absence period PUT error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Abwesenheitszeitraums' },
      { status: 500 }
    );
  }
}

// DELETE - Delete an absence period
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    }

    if (session.user.activeRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 });
    }

    const { id } = await params;

    await prisma.absencePeriod.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Abwesenheitszeitraum gelöscht',
    });
  } catch (error) {
    console.error('Absence period DELETE error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Abwesenheitszeitraums' },
      { status: 500 }
    );
  }
}
