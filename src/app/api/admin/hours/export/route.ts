import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/authHelpers';
import { trainerHoursService } from '@/lib/services/trainerHoursService';
import { asyncHandler } from '@/lib/api/errorHandlers';

export const GET = asyncHandler(async (request: Request) => {
  await requireAdmin();
  const { searchParams } = new URL(request.url);

  const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1), 10);
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()), 10);

  const { content, filename } = await trainerHoursService.exportToCSV(month, year);

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
});