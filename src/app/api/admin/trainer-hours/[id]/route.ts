import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { trainerHoursService } from '@/lib/services/trainerHoursService';

/**
 * PUT /api/admin/trainer-hours/[id]
 * Update trainer hours adjustment
 */
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.activeRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { adjustedHours, notes } = body;

    if (typeof adjustedHours !== 'number' || adjustedHours < 0) {
      return NextResponse.json(
        { error: 'Invalid adjusted hours value' },
        { status: 400 }
      );
    }

    // Get the summary to find trainerId, month, year
    const { prisma } = await import('@/lib/prisma');
    const existingSummary = await prisma.monthlyTrainerSummary.findUnique({
      where: { id },
    });

    if (!existingSummary) {
      return NextResponse.json(
        { error: 'Summary not found' },
        { status: 404 }
      );
    }

    const updated = await trainerHoursService.adjustMonthlyHours(
      existingSummary.trainerId,
      existingSummary.month,
      existingSummary.year,
      adjustedHours,
      session.user.id,
      notes
    );

    // Convert Decimal to number for JSON serialization
    const serialized = {
      ...updated,
      calculatedHours: Number(updated.calculatedHours),
      adjustedHours: updated.adjustedHours ? Number(updated.adjustedHours) : null,
      finalHours: Number(updated.finalHours),
    };

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('Error updating trainer hours:', error);
    return NextResponse.json(
      { error: 'Failed to update trainer hours' },
      { status: 500 }
    );
  }
}
