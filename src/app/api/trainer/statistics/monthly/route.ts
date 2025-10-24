import { NextResponse } from 'next/server';
import { statisticsService } from '@/lib/services/statisticsService';
import { requireTrainer } from '@/lib/api/authHelpers';
import { handleApiError } from '@/lib/api/errorHandlers';

export async function GET() {
  try {
    await requireTrainer();

    const months = 6;
    const stats = await statisticsService.getMonthlyComparison(months);

    return NextResponse.json(stats);
  } catch (error) {
    return handleApiError(error);
  }
}
