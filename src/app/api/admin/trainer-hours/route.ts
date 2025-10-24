import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { trainerHoursService } from '@/lib/services/trainerHoursService';

/**
 * GET /api/admin/trainer-hours?month=10&year=2025
 * Get all trainer hour summaries for a specific month
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const month = parseInt(searchParams.get('month') || '');
    const year = parseInt(searchParams.get('year') || '');

    if (!month || !year || month < 1 || month > 12) {
      return NextResponse.json(
        { error: 'Invalid month or year parameter' },
        { status: 400 }
      );
    }

    const summaries = await trainerHoursService.getAllSummariesForMonth(month, year);

    // Convert Decimal to number for JSON serialization
    const serializedSummaries = summaries.map((summary) => {
      if (!summary) return null;
      return {
        ...summary,
        calculatedHours: Number(summary.calculatedHours),
        adjustedHours: summary.adjustedHours ? Number(summary.adjustedHours) : null,
        finalHours: Number(summary.finalHours),
      };
    }).filter(Boolean);

    return NextResponse.json(serializedSummaries);
  } catch (error) {
    console.error('Error fetching trainer hours:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trainer hours' },
      { status: 500 }
    );
  }
}
