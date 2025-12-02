import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';

// GET - Get system settings
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

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
      },
    });
  }

  return NextResponse.json({ data: settings });
}

// PUT - Update system settings
export async function PUT(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();

  const settings = await prisma.systemSettings.upsert({
    where: { id: 'default' },
    update: {
      cancellationDeadlineHours: body.cancellationDeadlineHours,
      sessionGenerationDaysAhead: body.sessionGenerationDaysAhead,
      absenceAlertThreshold: body.absenceAlertThreshold,
      absenceAlertWindowDays: body.absenceAlertWindowDays,
      absenceAlertCooldownDays: body.absenceAlertCooldownDays,
      absenceAlertEnabled: body.absenceAlertEnabled,
      attendanceConfirmationMode: body.attendanceConfirmationMode,
    },
    create: {
      id: 'default',
      cancellationDeadlineHours: body.cancellationDeadlineHours ?? 2,
      sessionGenerationDaysAhead: body.sessionGenerationDaysAhead ?? 56,
      absenceAlertThreshold: body.absenceAlertThreshold ?? 3,
      absenceAlertWindowDays: body.absenceAlertWindowDays ?? 30,
      absenceAlertCooldownDays: body.absenceAlertCooldownDays ?? 14,
      absenceAlertEnabled: body.absenceAlertEnabled ?? true,
      attendanceConfirmationMode: body.attendanceConfirmationMode ?? 'AUTO_CONFIRM',
    },
  });

  return NextResponse.json({
    data: settings,
    message: 'Einstellungen erfolgreich gespeichert',
  });
}
