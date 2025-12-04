import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get public system settings (for authenticated users)
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
  }

  let settings = await prisma.systemSettings.findFirst({
    where: { id: 'default' },
  });

  // Create default settings if not exists
  if (!settings) {
    settings = await prisma.systemSettings.create({
      data: {
        id: 'default',
        cancellationDeadlineHours: 2,
        sessionGenerationDaysAhead: 56,
        absenceAlertThreshold: 3,
        absenceAlertWindowDays: 30,
        absenceAlertCooldownDays: 14,
        absenceAlertEnabled: true,
        attendanceConfirmationMode: 'AUTO_CONFIRM',
      },
    });
  }

  // Return only public settings
  return NextResponse.json({
    data: {
      cancellationDeadlineHours: settings.cancellationDeadlineHours,
      attendanceConfirmationMode: settings.attendanceConfirmationMode,
    },
  });
}
