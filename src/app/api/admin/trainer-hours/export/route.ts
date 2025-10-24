import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { trainerHoursService } from '@/lib/services/trainerHoursService';

/**
 * GET /api/admin/trainer-hours/export?month=10&year=2025
 * Export trainer hours to CSV
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

    const { content, filename } = await trainerHoursService.exportToCSV(month, year);

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting trainer hours:', error);
    return NextResponse.json(
      { error: 'Failed to export trainer hours' },
      { status: 500 }
    );
  }
}
