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
  const { session, error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();

  // Get current settings to check if confirmation mode is changing
  const currentSettings = await prisma.systemSettings.findFirst({
    where: { id: 'default' },
  });

  const oldMode = currentSettings?.attendanceConfirmationMode || 'AUTO_CONFIRM';
  const newMode = body.attendanceConfirmationMode;

  // If confirmation mode is changing, reset future session confirmations
  if (newMode && oldMode !== newMode) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (newMode === 'REQUIRE_CONFIRMATION') {
      // BUG FIX #2: Switching to REQUIRE_CONFIRMATION: 
      // Delete ALL confirmations for future sessions (both athletes AND trainers need to actively confirm)
      await prisma.sessionConfirmation.deleteMany({
        where: {
          trainingSession: {
            date: { gte: today },
          },
        },
      });
      console.log(`[Settings] Mode changed to REQUIRE_CONFIRMATION: Reset all future confirmations (athletes AND trainers)`);
    } else if (newMode === 'AUTO_CONFIRM') {
      // BUG FIX #2: Switching to AUTO_CONFIRM:
      // Delete all confirmations for future sessions except declines
      // Both athletes AND trainers who explicitly declined should keep their decline
      await prisma.sessionConfirmation.deleteMany({
        where: {
          confirmed: true, // Only delete explicit confirmations, keep declines
          trainingSession: {
            date: { gte: today },
          },
        },
      });
      console.log(`[Settings] Mode changed to AUTO_CONFIRM: Reset all future confirmations (kept declines for both athletes AND trainers)`);
    }
  }

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
      // Email notification settings
      emailRegistrationNotification: body.emailRegistrationNotification,
      emailApprovalNotification: body.emailApprovalNotification,
      emailAbsenceAlert: body.emailAbsenceAlert,
      emailSessionCancellation: body.emailSessionCancellation,
      // Track who modified
      lastModifiedBy: session!.user.trainerProfileId,
      lastModifiedAt: new Date(),
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
      // Email notification settings
      emailRegistrationNotification: body.emailRegistrationNotification ?? true,
      emailApprovalNotification: body.emailApprovalNotification ?? true,
      emailAbsenceAlert: body.emailAbsenceAlert ?? true,
      emailSessionCancellation: body.emailSessionCancellation ?? true,
      lastModifiedBy: session!.user.trainerProfileId,
      lastModifiedAt: new Date(),
    },
  });

  return NextResponse.json({
    data: settings,
    message: newMode && oldMode !== newMode 
      ? 'Einstellungen gespeichert. Bestätigungen für zukünftige Trainings wurden zurückgesetzt (Athleten und Trainer).'
      : 'Einstellungen erfolgreich gespeichert',
  });
}