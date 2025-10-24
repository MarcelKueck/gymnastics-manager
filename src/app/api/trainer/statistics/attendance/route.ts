import { NextResponse } from 'next/server';
import { statisticsService } from '@/lib/services/statisticsService';
import { requireTrainer } from '@/lib/api/authHelpers';
import { handleApiError } from '@/lib/api/errorHandlers';

export async function GET(request: Request) {
  try {
    await requireTrainer();

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    if (!dateFrom || !dateTo) {
      return NextResponse.json(
        { error: 'dateFrom and dateTo are required' },
        { status: 400 }
      );
    }

    const stats = await statisticsService.getAttendanceStatistics(
      new Date(dateFrom),
      new Date(dateTo)
    );

    return NextResponse.json(stats);
  } catch (error) {
    return handleApiError(error);
  }
}
