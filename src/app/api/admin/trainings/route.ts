import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const trainingSchema = z.object({
  name: z.string().min(1, 'Name erforderlich'),
  dayOfWeek: z.enum([
    'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY',
    'FRIDAY', 'SATURDAY', 'SUNDAY'
  ]),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format: HH:MM'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format: HH:MM'),
  recurrence: z.enum(['WEEKLY', 'BIWEEKLY']).optional().default('WEEKLY'),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
});

// GET - List all recurring trainings
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const trainings = await prisma.recurringTraining.findMany({
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
      createdByTrainer: {
        include: { user: true },
      },
    },
    orderBy: [
      { dayOfWeek: 'asc' },
      { startTime: 'asc' },
    ],
  });

  const data = trainings.map((training) => ({
    id: training.id,
    name: training.name,
    dayOfWeek: training.dayOfWeek,
    startTime: training.startTime,
    endTime: training.endTime,
    recurrence: training.recurrence,
    isActive: training.isActive,
    validFrom: training.validFrom?.toISOString(),
    validUntil: training.validUntil?.toISOString(),
    createdBy: training.createdByTrainer
      ? `${training.createdByTrainer.user.firstName} ${training.createdByTrainer.user.lastName}`
      : null,
    groups: training.trainingGroups.map((group) => ({
      id: group.id,
      name: group.name,
      athleteCount: group.athleteAssignments.length,
      trainerCount: group.trainerAssignments.length,
      trainers: group.trainerAssignments.map((ta) => ({
        id: ta.trainer.id,
        name: `${ta.trainer.user.firstName} ${ta.trainer.user.lastName}`,
        isPrimary: ta.isPrimary,
      })),
    })),
  }));

  return NextResponse.json({ data });
}

// POST - Create new recurring training
export async function POST(request: NextRequest) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  // Always fetch trainer profile from DB to ensure we have the correct ID
  const trainerProfile = await prisma.trainerProfile.findUnique({
    where: { userId: session!.user.id },
  });
  
  if (!trainerProfile) {
    return NextResponse.json(
      { error: 'Trainer-Profil nicht gefunden' },
      { status: 400 }
    );
  }

  const body = await request.json();

  const validation = trainingSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Ungültige Eingabe', details: validation.error.flatten() },
      { status: 400 }
    );
  }

  const data = validation.data;

  // Validate time order
  if (data.startTime >= data.endTime) {
    return NextResponse.json(
      { error: 'Endzeit muss nach Startzeit sein' },
      { status: 400 }
    );
  }

  const training = await prisma.recurringTraining.create({
    data: {
      name: data.name,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      recurrence: data.recurrence,
      validFrom: data.validFrom ? new Date(data.validFrom) : null,
      validUntil: data.validUntil ? new Date(data.validUntil) : null,
      createdBy: trainerProfile.id,
    },
    include: {
      trainingGroups: true,
    },
  });

  return NextResponse.json({
    data: training,
    message: 'Training erfolgreich erstellt',
  });
}
