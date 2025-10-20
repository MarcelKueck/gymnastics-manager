// src/lib/email.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@gym-portal.com';

// Brand color for emails
const BRAND_COLOR = '#509f28';

// Helper function to format training days
function formatTrainingDays(days: string[]): string {
  const dayMap: Record<string, string> = {
    monday: 'Montag',
    tuesday: 'Dienstag',
    wednesday: 'Mittwoch',
    thursday: 'Donnerstag',
    friday: 'Freitag',
    saturday: 'Samstag',
    sunday: 'Sonntag'
  };
  return days.map(day => dayMap[day.toLowerCase()] || day).join(', ');
}

// Helper function to format training hours
function formatTrainingHours(hours: string[]): string {
  const hourMap: Record<string, string> = {
    first: '1. Stunde',
    second: '2. Stunde',
    both: '1. & 2. Stunde'
  };
  return hours.map(hour => hourMap[hour.toLowerCase()] || hour).join(', ');
}

// Base email template wrapper
function emailTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Turnverein Mitteilung</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: ${BRAND_COLOR}; padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                Turnverein Portal
              </h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                Turnverein Trainingsverwaltung
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht auf diese E-Mail.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// Email Type 1: Athlete Approved & Configured
export async function sendAthleteApprovalEmail(data: {
  athleteEmail: string;
  guardianEmail?: string | null;
  athleteName: string;
  trainingDays: string[];
  trainingHours: string[];
  group: number;
  youthCategory: string;
  isCompetition: boolean;
}) {
  const content = `
    <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 22px; font-weight: 600;">
      Willkommen beim Turnverein! 🎉
    </h2>
    
    <p style="margin: 0 0 16px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Hallo ${data.athleteName},
    </p>
    
    <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Dein Account wurde erfolgreich freigeschaltet und deine Trainingskonfiguration wurde eingerichtet.
    </p>
    
    <div style="background-color: #f0fdf4; border-left: 4px solid ${BRAND_COLOR}; padding: 20px; margin: 0 0 24px 0; border-radius: 4px;">
      <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 18px; font-weight: 600;">
        Deine Trainingszeiten
      </h3>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 500;">Trainingstage:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${formatTrainingDays(data.trainingDays)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 500;">Trainingsstunden:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${formatTrainingHours(data.trainingHours)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 500;">Gruppe:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">Gruppe ${data.group}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 500;">Jugendkategorie:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${data.youthCategory}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 500;">Wettkampf:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${data.isCompetition ? 'Ja' : 'Nein'}</td>
        </tr>
      </table>
    </div>
    
    <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Du kannst dich jetzt im Portal anmelden und deine Trainingstermine einsehen, Trainings absagen und deine Anwesenheit verfolgen.
    </p>
    
    <table role="presentation" style="margin: 0 0 24px 0;">
      <tr>
        <td>
          <a href="${BASE_URL}/login" style="display: inline-block; background-color: ${BRAND_COLOR}; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 16px;">
            Jetzt anmelden
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
      Bei Fragen kannst du dich jederzeit an deinen Trainer wenden.
    </p>
  `;

  const recipients = [data.athleteEmail];
  if (data.guardianEmail) {
    recipients.push(data.guardianEmail);
  }

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipients,
      subject: 'Account freigeschaltet - Willkommen beim Turnverein!',
      html: emailTemplate(content),
    });
    
    console.log('✅ Approval email sent:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('❌ Error sending approval email:', error);
    return { success: false, error };
  }
}

// Email Type 2: Training Schedule Changed
export async function sendScheduleChangeEmail(data: {
  athleteEmail: string;
  guardianEmail?: string | null;
  athleteName: string;
  oldSchedule: {
    trainingDays: string[];
    trainingHours: string[];
    group: number;
  };
  newSchedule: {
    trainingDays: string[];
    trainingHours: string[];
    group: number;
  };
}) {
  const content = `
    <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 22px; font-weight: 600;">
      Trainingstermine geändert
    </h2>
    
    <p style="margin: 0 0 16px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Hallo ${data.athleteName},
    </p>
    
    <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Deine Trainingstermine wurden aktualisiert. Hier ist eine Übersicht der Änderungen:
    </p>
    
    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 0 0 16px 0; border-radius: 4px;">
      <h3 style="margin: 0 0 12px 0; color: #111827; font-size: 16px; font-weight: 600;">
        Bisheriger Plan
      </h3>
      <p style="margin: 0 0 8px 0; color: #374151; font-size: 14px;">
        <strong>Tage:</strong> ${formatTrainingDays(data.oldSchedule.trainingDays)}
      </p>
      <p style="margin: 0 0 8px 0; color: #374151; font-size: 14px;">
        <strong>Stunden:</strong> ${formatTrainingHours(data.oldSchedule.trainingHours)}
      </p>
      <p style="margin: 0; color: #374151; font-size: 14px;">
        <strong>Gruppe:</strong> Gruppe ${data.oldSchedule.group}
      </p>
    </div>
    
    <div style="background-color: #f0fdf4; border-left: 4px solid ${BRAND_COLOR}; padding: 20px; margin: 0 0 24px 0; border-radius: 4px;">
      <h3 style="margin: 0 0 12px 0; color: #111827; font-size: 16px; font-weight: 600;">
        Neuer Plan
      </h3>
      <p style="margin: 0 0 8px 0; color: #111827; font-size: 14px; font-weight: 600;">
        <strong>Tage:</strong> ${formatTrainingDays(data.newSchedule.trainingDays)}
      </p>
      <p style="margin: 0 0 8px 0; color: #111827; font-size: 14px; font-weight: 600;">
        <strong>Stunden:</strong> ${formatTrainingHours(data.newSchedule.trainingHours)}
      </p>
      <p style="margin: 0; color: #111827; font-size: 14px; font-weight: 600;">
        <strong>Gruppe:</strong> Gruppe ${data.newSchedule.group}
      </p>
    </div>
    
    <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Die Änderungen sind ab sofort wirksam. Du kannst deine aktualisierten Trainingstermine im Portal einsehen.
    </p>
    
    <table role="presentation" style="margin: 0 0 24px 0;">
      <tr>
        <td>
          <a href="${BASE_URL}/athlete/schedule" style="display: inline-block; background-color: ${BRAND_COLOR}; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 16px;">
            Trainingstermine ansehen
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
      Bei Fragen wende dich bitte an deinen Trainer.
    </p>
  `;

  const recipients = [data.athleteEmail];
  if (data.guardianEmail) {
    recipients.push(data.guardianEmail);
  }

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipients,
      subject: 'Trainingstermine wurden geändert',
      html: emailTemplate(content),
    });
    
    console.log('✅ Schedule change email sent:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('❌ Error sending schedule change email:', error);
    return { success: false, error };
  }
}

// Email Type 3: Training Plan Uploaded
export async function sendTrainingPlanUploadedEmail(data: {
  athleteEmails: Array<{ email: string; name: string }>;
  category: string;
  title: string;
  targetDate?: string | null;
}) {
  const categoryMap: Record<string, string> = {
    strength_goals: 'Kraftziele',
    strength_exercises: 'Kraftübungen',
    flexibility_goals: 'Dehnziele',
    flexibility_exercises: 'Dehnübungen'
  };

  const content = `
    <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 22px; font-weight: 600;">
      Neue Trainingstermine verfügbar! 📋
    </h2>
    
    <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Neue Trainingstermine wurden hochgeladen und stehen jetzt zum Download bereit.
    </p>
    
    <div style="background-color: #f0fdf4; border-left: 4px solid ${BRAND_COLOR}; padding: 20px; margin: 0 0 24px 0; border-radius: 4px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 500;">Kategorie:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${categoryMap[data.category] || data.category}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 500;">Titel:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${data.title}</td>
        </tr>
        ${data.targetDate ? `
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 500;">Zieldatum:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${new Date(data.targetDate).toLocaleDateString('de-DE')}</td>
        </tr>
        ` : ''}
      </table>
    </div>
    
    <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Du kannst den Plan jetzt im Portal herunterladen und durcharbeiten.
    </p>
    
    <table role="presentation" style="margin: 0;">
      <tr>
        <td>
          <a href="${BASE_URL}/athlete/training-plans" style="display: inline-block; background-color: ${BRAND_COLOR}; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 16px;">
            Trainingstermine herunterladen
          </a>
        </td>
      </tr>
    </table>
  `;

  // Send to all approved athletes
  const emailPromises = data.athleteEmails.map(athlete => 
    resend.emails.send({
      from: FROM_EMAIL,
      to: athlete.email,
      subject: 'Neue Trainingstermine verfügbar',
      html: emailTemplate(content),
    })
  );

  try {
    const results = await Promise.allSettled(emailPromises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`✅ Training plan emails: ${successful} sent, ${failed} failed`);
    return { success: true, sent: successful, failed };
  } catch (error: unknown) {
    console.error('❌ Error sending training plan emails:', error);
    return { success: false, error };
  }
}

// Email Type 4: Unexcused Absence Alert (3+)
export async function sendUnexcusedAbsenceAlert(data: {
  athleteEmail: string;
  guardianEmail?: string | null;
  athleteName: string;
  unexcusedCount: number;
  absenceDates: string[];
  sendToAthlete: boolean;
  trainerEmail: string;
}) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const athleteContent = `
    <h2 style="margin: 0 0 20px 0; color: #dc2626; font-size: 22px; font-weight: 600;">
      ⚠️ Fehlzeiten-Benachrichtigung
    </h2>
    
    <p style="margin: 0 0 16px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Hallo ${data.athleteName},
    </p>
    
    <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Wir möchten dich darauf aufmerksam machen, dass du ${data.unexcusedCount} unentschuldigte Fehlzeiten im Training hast.
    </p>
    
    <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 0 0 24px 0; border-radius: 4px;">
      <h3 style="margin: 0 0 12px 0; color: #991b1b; font-size: 16px; font-weight: 600;">
        Unentschuldigte Fehlzeiten (${data.unexcusedCount})
      </h3>
      <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px; line-height: 1.8;">
        ${data.absenceDates.map(date => `<li>${formatDate(date)}</li>`).join('')}
      </ul>
    </div>
    
    <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Bitte nimm Kontakt mit deinem Trainer auf, um die Situation zu besprechen. Regelmäßige Teilnahme am Training ist wichtig für deinen Fortschritt und den Zusammenhalt in der Gruppe.
    </p>
    
    <table role="presentation" style="margin: 0 0 24px 0;">
      <tr>
        <td>
          <a href="${BASE_URL}/athlete/attendance" style="display: inline-block; background-color: ${BRAND_COLOR}; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 16px;">
            Anwesenheit ansehen
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
      Wenn du Fragen hast oder besondere Umstände vorliegen, sprich bitte mit deinem Trainer.
    </p>
  `;

  const trainerContent = `
    <h2 style="margin: 0 0 20px 0; color: #dc2626; font-size: 22px; font-weight: 600;">
      ⚠️ Fehlzeiten-Alert: ${data.athleteName}
    </h2>
    
    <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      ${data.athleteName} hat ${data.unexcusedCount} unentschuldigte Fehlzeiten erreicht.
    </p>
    
    <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 0 0 24px 0; border-radius: 4px;">
      <h3 style="margin: 0 0 12px 0; color: #991b1b; font-size: 16px; font-weight: 600;">
        Unentschuldigte Fehlzeiten (${data.unexcusedCount})
      </h3>
      <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px; line-height: 1.8;">
        ${data.absenceDates.map(date => `<li>${formatDate(date)}</li>`).join('')}
      </ul>
    </div>
    
    <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Bitte nimm Kontakt mit dem Athleten auf, um die Situation zu besprechen.
    </p>
    
    <table role="presentation" style="margin: 0;">
      <tr>
        <td>
          <a href="${BASE_URL}/trainer/athletes" style="display: inline-block; background-color: ${BRAND_COLOR}; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 16px;">
            Athleten-Übersicht öffnen
          </a>
        </td>
      </tr>
    </table>
  `;

  const promises: Promise<any>[] = [];

  // Send to trainer (always)
  promises.push(
    resend.emails.send({
      from: FROM_EMAIL,
      to: data.trainerEmail,
      subject: `Fehlzeiten-Alert: ${data.athleteName} (${data.unexcusedCount} unentschuldigt)`,
      html: emailTemplate(trainerContent),
    })
  );

  // Send to athlete and guardian (if enabled)
  if (data.sendToAthlete) {
    const recipients = [data.athleteEmail];
    if (data.guardianEmail) {
      recipients.push(data.guardianEmail);
    }
    
    promises.push(
      resend.emails.send({
        from: FROM_EMAIL,
        to: recipients,
        subject: `Wichtig: ${data.unexcusedCount} unentschuldigte Fehlzeiten im Training`,
        html: emailTemplate(athleteContent),
      })
    );
  }

  try {
    const results = await Promise.allSettled(promises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`✅ Absence alert emails: ${successful} sent, ${failed} failed`);
    return { success: true, sent: successful, failed };
  } catch (error) {
    console.error('❌ Error sending absence alert emails:', error);
    return { success: false, error };
  }
}