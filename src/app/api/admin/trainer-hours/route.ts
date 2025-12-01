import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';
import {
  getTrainerHoursForMonth,
  getTrainerSessionDetails,
  saveTrainerHoursSummary,
  exportTrainerHoursToCSV,
} from '@/lib/services/trainerHoursService';

// GET - Get trainer hours for a specific month
export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const month = parseInt(searchParams.get('month') || new Date().getMonth() + 1 + '');
  const year = parseInt(searchParams.get('year') || new Date().getFullYear() + '');
  const trainerId = searchParams.get('trainerId');
  const format = searchParams.get('format');

  try {
    // If trainerId is provided, get session details for that trainer
    if (trainerId) {
      const sessions = await getTrainerSessionDetails(trainerId, month, year);
      return NextResponse.json({ data: sessions });
    }

    // Get summaries for all trainers
    const summaries = await getTrainerHoursForMonth(month, year);

    // If CSV format is requested
    if (format === 'csv') {
      const csv = exportTrainerHoursToCSV(summaries);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="trainerstunden_${year}_${month.toString().padStart(2, '0')}.csv"`,
        },
      });
    }

    return NextResponse.json({ data: summaries });
  } catch (err) {
    console.error('Error fetching trainer hours:', err);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Trainerstunden' },
      { status: 500 }
    );
  }
}

// POST - Save/update trainer hours adjustment
export async function POST(request: NextRequest) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const { trainerId, month, year, adjustedHours, notes } = body;

    if (!trainerId || !month || !year) {
      return NextResponse.json(
        { error: 'Trainer, Monat und Jahr sind erforderlich' },
        { status: 400 }
      );
    }

    await saveTrainerHoursSummary(
      trainerId,
      month,
      year,
      { adjustedHours, notes },
      session!.user.trainerProfileId!
    );

    return NextResponse.json({
      success: true,
      message: 'Stunden erfolgreich gespeichert',
    });
  } catch (err) {
    console.error('Error saving trainer hours:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Fehler beim Speichern' },
      { status: 500 }
    );
  }
}
