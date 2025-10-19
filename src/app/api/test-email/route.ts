// src/app/api/test-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  sendAthleteApprovalEmail,
  sendScheduleChangeEmail,
  sendTrainingPlanUploadedEmail,
  sendUnexcusedAbsenceAlert,
} from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Only allow trainers to test emails
    if (!session || session.user.role !== 'TRAINER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, testEmail } = body;

    if (!type || !testEmail) {
      return NextResponse.json(
        { error: 'Missing type or testEmail' },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case 'approval':
        result = await sendAthleteApprovalEmail({
          athleteEmail: testEmail,
          guardianEmail: null,
          athleteName: 'Test Athlet',
          trainingDays: ['monday', 'thursday', 'friday'],
          trainingHours: ['first', 'second'],
          group: 2,
          youthCategory: 'U12',
          isCompetition: true,
        });
        break;

      case 'schedule_change':
        result = await sendScheduleChangeEmail({
          athleteEmail: testEmail,
          guardianEmail: null,
          athleteName: 'Test Athlet',
          oldSchedule: {
            trainingDays: ['monday', 'wednesday'],
            trainingHours: ['first'],
            group: 1,
          },
          newSchedule: {
            trainingDays: ['monday', 'thursday', 'friday'],
            trainingHours: ['first', 'second'],
            group: 2,
          },
        });
        break;

      case 'training_plan':
        result = await sendTrainingPlanUploadedEmail({
          athleteEmails: [{ email: testEmail, name: 'Test Athlet' }],
          category: 'strength_goals',
          title: 'Kraftziele Herbst 2024',
          targetDate: new Date().toISOString(),
        });
        break;

      case 'absence_alert':
        result = await sendUnexcusedAbsenceAlert({
          athleteEmail: testEmail,
          guardianEmail: null,
          athleteName: 'Test Athlet',
          unexcusedCount: 3,
          absenceDates: [
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          ],
          sendToAthlete: true,
          trainerEmail: session.user.email,
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid email type' },
          { status: 400 }
        );
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Test email sent successfully to ${testEmail}`,
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to send test email', details: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    );
  }
}