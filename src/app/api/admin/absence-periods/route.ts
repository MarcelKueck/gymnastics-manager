import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';

// GET - Get all absence periods
export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const athleteId = searchParams.get('athleteId');
  const trainerId = searchParams.get('trainerId');
  const activeOnly = searchParams.get('activeOnly') !== 'false';

  const where: {
    athleteId?: string;
    trainerId?: string;
    isActive?: boolean;
  } = {};

  if (athleteId) where.athleteId = athleteId;
  if (trainerId) where.trainerId = trainerId;
  if (activeOnly) where.isActive = true;

  const absencePeriods = await prisma.absencePeriod.findMany({
    where,
    include: {
      athlete: {
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
      },
      trainer: {
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
      },
      createdByAdmin: {
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
    data: absencePeriods.map((p) => ({
      id: p.id,
      athleteId: p.athleteId,
      trainerId: p.trainerId,
      personName: p.athlete
        ? `${p.athlete.user.firstName} ${p.athlete.user.lastName}`
        : p.trainer
        ? `${p.trainer.user.firstName} ${p.trainer.user.lastName}`
        : 'Unbekannt',
      personType: p.athleteId ? 'athlete' : 'trainer',
      startDate: p.startDate.toISOString(),
      endDate: p.endDate.toISOString(),
      reason: p.reason,
      notes: p.notes,
      createdBy: p.createdByAdmin
        ? `${p.createdByAdmin.user.firstName} ${p.createdByAdmin.user.lastName}`
        : 'Unbekannt',
      createdAt: p.createdAt.toISOString(),
      isActive: p.isActive,
    })),
  });
}

// POST - Create a new absence period
export async function POST(request: NextRequest) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const { athleteId, trainerId, startDate, endDate, reason, notes } = body;

  // Validate that either athleteId or trainerId is provided
  if (!athleteId && !trainerId) {
    return NextResponse.json(
      { error: 'Entweder Athlet oder Trainer muss angegeben werden' },
      { status: 400 }
    );
  }

  if (athleteId && trainerId) {
    return NextResponse.json(
      { error: 'Nur Athlet oder Trainer kann angegeben werden, nicht beides' },
      { status: 400 }
    );
  }

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: 'Start- und Enddatum sind erforderlich' },
      { status: 400 }
    );
  }

  if (!reason || reason.trim().length < 3) {
    return NextResponse.json(
      { error: 'Grund muss mindestens 3 Zeichen haben' },
      { status: 400 }
    );
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (end < start) {
    return NextResponse.json(
      { error: 'Enddatum muss nach Startdatum liegen' },
      { status: 400 }
    );
  }

  // Get admin's trainer profile
  const adminProfile = await prisma.trainerProfile.findFirst({
    where: { userId: session!.user.id },
  });

  if (!adminProfile) {
    return NextResponse.json({ error: 'Admin-Profil nicht gefunden' }, { status: 404 });
  }

  const absencePeriod = await prisma.absencePeriod.create({
    data: {
      athleteId: athleteId || null,
      trainerId: trainerId || null,
      startDate: start,
      endDate: end,
      reason: reason.trim(),
      notes: notes?.trim() || null,
      createdBy: adminProfile.id,
    },
    include: {
      athlete: {
        include: {
          user: { select: { firstName: true, lastName: true } },
        },
      },
      trainer: {
        include: {
          user: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  return NextResponse.json({
    success: true,
    message: 'Abwesenheitszeitraum erstellt',
    data: {
      id: absencePeriod.id,
      personName: absencePeriod.athlete
        ? `${absencePeriod.athlete.user.firstName} ${absencePeriod.athlete.user.lastName}`
        : absencePeriod.trainer
        ? `${absencePeriod.trainer.user.firstName} ${absencePeriod.trainer.user.lastName}`
        : 'Unbekannt',
    },
  });
}
