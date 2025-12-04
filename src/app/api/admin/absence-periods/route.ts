import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get all absence periods
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    }

    if (session.user.activeRole !== 'ADMIN' && session.user.activeRole !== 'TRAINER') {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const athleteId = searchParams.get('athleteId');
    const trainerId = searchParams.get('trainerId');
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const absencePeriods = await prisma.absencePeriod.findMany({
      where: {
        ...(athleteId ? { athleteId } : {}),
        ...(trainerId ? { trainerId } : {}),
        ...(activeOnly ? { isActive: true } : {}),
      },
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
        createdByTrainer: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    return NextResponse.json({
      data: absencePeriods.map((period) => ({
        id: period.id,
        athleteId: period.athleteId,
        athleteName: period.athlete
          ? `${period.athlete.user.firstName} ${period.athlete.user.lastName}`
          : null,
        trainerId: period.trainerId,
        trainerName: period.trainer
          ? `${period.trainer.user.firstName} ${period.trainer.user.lastName}`
          : null,
        startDate: period.startDate.toISOString(),
        endDate: period.endDate.toISOString(),
        reason: period.reason,
        notes: period.notes,
        isActive: period.isActive,
        createdBy: period.createdByTrainer
          ? `${period.createdByTrainer.user.firstName} ${period.createdByTrainer.user.lastName}`
          : null,
        createdAt: period.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Absence periods GET error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Abwesenheitszeiträume' },
      { status: 500 }
    );
  }
}

// POST - Create a new absence period
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    }

    if (session.user.activeRole !== 'ADMIN' && session.user.activeRole !== 'TRAINER') {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 });
    }

    const trainerProfile = await prisma.trainerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!trainerProfile) {
      return NextResponse.json({ error: 'Trainer-Profil nicht gefunden' }, { status: 404 });
    }

    const body = await request.json();
    const { athleteId, trainerId, startDate, endDate, reason, notes } = body;

    if (!startDate || !endDate || !reason) {
      return NextResponse.json(
        { error: 'Start- und Enddatum sowie Grund sind erforderlich' },
        { status: 400 }
      );
    }

    if (!athleteId && !trainerId) {
      return NextResponse.json(
        { error: 'Entweder Athlet oder Trainer muss angegeben werden' },
        { status: 400 }
      );
    }

    const absencePeriod = await prisma.absencePeriod.create({
      data: {
        athleteId: athleteId || null,
        trainerId: trainerId || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
        notes: notes || null,
        createdBy: trainerProfile.id,
      },
    });

    return NextResponse.json({
      data: absencePeriod,
      message: 'Abwesenheitszeitraum erstellt',
    });
  } catch (error) {
    console.error('Absence period POST error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Abwesenheitszeitraums' },
      { status: 500 }
    );
  }
}
