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
  const content = `
    <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 22px; font-weight: 600;">
      Neue Datei verfügbar! 📋
    </h2>
    
    <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Eine neue Datei wurde hochgeladen und steht jetzt zum Download bereit.
    </p>
    
    <div style="background-color: #f0fdf4; border-left: 4px solid ${BRAND_COLOR}; padding: 20px; margin: 0 0 24px 0; border-radius: 4px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 500;">Kategorie:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${data.category}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 500;">Titel:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${data.title}</td>
        </tr>
        ${data.targetDate ? `
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 500;">Zieldatum:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${data.targetDate}</td>
        </tr>
        ` : ''}
      </table>
    </div>
    
    <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Du kannst die Datei jetzt im Portal herunterladen.
    </p>
    
    <table role="presentation" style="margin: 0;">
      <tr>
        <td>
          <a href="${BASE_URL}/athlete/files" style="display: inline-block; background-color: ${BRAND_COLOR}; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 16px;">
            Datei herunterladen
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
      subject: 'Neue Datei verfügbar',
      html: emailTemplate(content),
    })
  );

  try {
    const results = await Promise.allSettled(emailPromises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`✅ File upload emails: ${successful} sent, ${failed} failed`);
    return { success: true, sent: successful, failed };
  } catch (error: unknown) {
    console.error('❌ Error sending file upload emails:', error);
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

// Email Type 5: Athlete Registration Confirmation
export async function sendAthleteRegistrationEmail(data: {
  athleteEmail: string;
  guardianEmail?: string | null;
  athleteName: string;
}) {
  const content = `
    <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 22px; font-weight: 600;">
      Registrierung erhalten! 📝
    </h2>
    
    <p style="margin: 0 0 16px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Hallo ${data.athleteName},
    </p>
    
    <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      vielen Dank für deine Registrierung beim Turnverein! Wir haben deine Anmeldung erhalten und werden sie in Kürze bearbeiten.
    </p>
    
    <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 0 0 24px 0; border-radius: 4px;">
      <h3 style="margin: 0 0 12px 0; color: #111827; font-size: 18px; font-weight: 600;">
        Nächste Schritte
      </h3>
      <ol style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px; line-height: 1.8;">
        <li>Ein Trainer wird deine Anmeldung prüfen</li>
        <li>Du erhältst eine weitere E-Mail, sobald dein Account freigeschaltet wurde</li>
        <li>Nach der Freischaltung kannst du dich im Portal anmelden</li>
      </ol>
    </div>
    
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 0 0 24px 0; border-radius: 4px;">
      <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
        <strong>Wichtig:</strong> Du kannst dich erst nach der Freischaltung durch einen Trainer im Portal anmelden. Dies kann 1-2 Werktage dauern.
      </p>
    </div>
    
    <p style="margin: 0 0 16px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Falls du Fragen hast, kannst du dich gerne an uns wenden.
    </p>
    
    <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
      Wir freuen uns darauf, dich bald im Training begrüßen zu dürfen!
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
      subject: 'Registrierung erhalten - Turnverein',
      html: emailTemplate(content),
    });
    
    console.log('✅ Registration confirmation email sent:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('❌ Error sending registration confirmation email:', error);
    return { success: false, error };
  }
}

// Email Type 6: Trainer Registration Confirmation
export async function sendTrainerRegistrationEmail(data: {
  trainerEmail: string;
  trainerName: string;
}) {
  const content = `
    <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 22px; font-weight: 600;">
      Trainer-Registrierung erhalten! 📝
    </h2>
    
    <p style="margin: 0 0 16px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Hallo ${data.trainerName},
    </p>
    
    <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      vielen Dank für deine Registrierung als Trainer! Wir haben deine Anmeldung erhalten und werden sie in Kürze bearbeiten.
    </p>
    
    <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 0 0 24px 0; border-radius: 4px;">
      <h3 style="margin: 0 0 12px 0; color: #111827; font-size: 18px; font-weight: 600;">
        Nächste Schritte
      </h3>
      <ol style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px; line-height: 1.8;">
        <li>Ein Administrator wird deine Anmeldung prüfen</li>
        <li>Du erhältst eine weitere E-Mail, sobald dein Account freigeschaltet wurde</li>
        <li>Nach der Freischaltung erhältst du Zugang zum Trainerportal</li>
      </ol>
    </div>
    
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 0 0 24px 0; border-radius: 4px;">
      <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
        <strong>Wichtig:</strong> Du kannst dich erst nach der Freischaltung durch einen Administrator im Portal anmelden. Dies kann 1-2 Werktage dauern.
      </p>
    </div>
    
    <p style="margin: 0 0 16px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Falls du Fragen hast, kannst du dich gerne an die Vereinsleitung wenden.
    </p>
    
    <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
      Wir freuen uns auf die Zusammenarbeit!
    </p>
  `;

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.trainerEmail,
      subject: 'Trainer-Registrierung erhalten - Turnverein',
      html: emailTemplate(content),
    });
    
    console.log('✅ Trainer registration confirmation email sent:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('❌ Error sending trainer registration confirmation email:', error);
    return { success: false, error };
  }
}