import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const groupSchema = z.object({
  recurringTrainingId: z.string(),
  name: z.string().min(1, 'Name erforderlich'),
  sortOrder: z.number().optional(),
});

// POST - Create new group
export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const validation = groupSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Ungültige Eingabe', details: validation.error.flatten() },
      { status: 400 }
    );
  }

  const data = validation.data;

  // Get max sort order
  const maxOrder = await prisma.trainingGroup.aggregate({
    where: { recurringTrainingId: data.recurringTrainingId },
    _max: { sortOrder: true },
  });

  const group = await prisma.trainingGroup.create({
    data: {
      recurringTrainingId: data.recurringTrainingId,
      name: data.name,
      sortOrder: data.sortOrder ?? (maxOrder._max.sortOrder || 0) + 1,
    },
  });

  return NextResponse.json({
    data: group,
    message: 'Gruppe erfolgreich erstellt',
  });
}
