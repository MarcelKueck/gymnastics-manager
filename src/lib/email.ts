import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';

const resend = new Resend(process.env.RESEND_API_KEY);

// FROM_EMAIL: Your verified Resend domain for sending
const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@turnen.svesting.de';

/**
 * Get all admin email addresses from the database
 * Returns emails of all users with TrainerProfile.role === 'ADMIN'
 */
export async function getAdminEmails(): Promise<string[]> {
  const admins = await prisma.trainerProfile.findMany({
    where: {
      role: 'ADMIN',
      isActive: true,
    },
    include: {
      user: {
        select: { email: true },
      },
    },
  });

  return admins.map((admin) => admin.user.email);
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail({ to, subject, html, replyTo }: SendEmailOptions) {
  // Skip email sending in development if no API key is configured
  if (!process.env.RESEND_API_KEY) {
    console.log('[Email] Skipping email send (no API key configured):', {
      to,
      subject,
    });
    return { success: true, skipped: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      replyTo,
    });

    if (error) {
      console.error('[Email] Failed to send email:', error);
      return { success: false, error };
    }

    console.log('[Email] Email sent successfully:', data?.id);
    return { success: true, data };
  } catch (error) {
    console.error('[Email] Error sending email:', error);
    return { success: false, error };
  }
}

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

export function getRegistrationNotificationTemplate(athlete: {
  firstName: string;
  lastName: string;
  email: string;
  guardianName?: string | null;
  guardianEmail?: string | null;
}): { subject: string; html: string } {
  return {
    subject: `Neue Registrierung: ${athlete.firstName} ${athlete.lastName}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #1a365d; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f8f9fa; }
    .info-box { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; border: 1px solid #e2e8f0; }
    .info-label { font-weight: bold; color: #4a5568; }
    .button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
    .footer { text-align: center; padding: 20px; color: #718096; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SV Esting Turnen</h1>
    </div>
    <div class="content">
      <h2>Neue Athlet-Registrierung</h2>
      <p>Ein neuer Athlet hat sich registriert und wartet auf Freigabe:</p>
      
      <div class="info-box">
        <p><span class="info-label">Name:</span> ${athlete.firstName} ${athlete.lastName}</p>
        <p><span class="info-label">E-Mail:</span> ${athlete.email}</p>
        ${athlete.guardianName ? `<p><span class="info-label">Erziehungsberechtigter:</span> ${athlete.guardianName}</p>` : ''}
        ${athlete.guardianEmail ? `<p><span class="info-label">E-Mail (Erziehungsberechtigter):</span> ${athlete.guardianEmail}</p>` : ''}
      </div>

      <p>Bitte überprüfen Sie die Registrierung und geben Sie den Athleten frei.</p>
      
      <a href="${process.env.NEXTAUTH_URL}/trainer/athletes" class="button">Zur Athletenverwaltung</a>
    </div>
    <div class="footer">
      <p>Diese E-Mail wurde automatisch vom SV Esting Gymnastics Manager gesendet.</p>
    </div>
  </div>
</body>
</html>
    `,
  };
}

export function getApprovalNotificationTemplate(athlete: {
  firstName: string;
  lastName: string;
}): { subject: string; html: string } {
  return {
    subject: 'Deine Registrierung wurde freigegeben - SV Esting Turnen',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #1a365d; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f8f9fa; }
    .success-box { background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
    .footer { text-align: center; padding: 20px; color: #718096; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SV Esting Turnen</h1>
    </div>
    <div class="content">
      <h2>Willkommen, ${athlete.firstName}!</h2>
      
      <div class="success-box">
        <p>✅ Deine Registrierung wurde erfolgreich freigegeben!</p>
      </div>

      <p>Du kannst dich jetzt einloggen und dein Athleten-Dashboard nutzen:</p>
      
      <ul>
        <li>Trainingszeiten einsehen</li>
        <li>Absagen für Trainings eintragen</li>
        <li>Deine Anwesenheitshistorie ansehen</li>
        <li>Für Wettkämpfe anmelden</li>
      </ul>

      <a href="${process.env.NEXTAUTH_URL}/login" class="button">Zum Login</a>

      <p style="margin-top: 20px;">Wir freuen uns auf dich beim Training!</p>
    </div>
    <div class="footer">
      <p>Diese E-Mail wurde automatisch vom SV Esting Gymnastics Manager gesendet.</p>
    </div>
  </div>
</body>
</html>
    `,
  };
}

export function getAbsenceAlertTemplate(athlete: {
  firstName: string;
  lastName: string;
}, absenceCount: number, windowDays: number): { subject: string; html: string } {
  return {
    subject: `Abwesenheitswarnung: ${athlete.firstName} ${athlete.lastName}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #1a365d; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f8f9fa; }
    .warning-box { background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .info-box { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; border: 1px solid #e2e8f0; }
    .info-label { font-weight: bold; color: #4a5568; }
    .button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
    .footer { text-align: center; padding: 20px; color: #718096; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SV Esting Turnen</h1>
    </div>
    <div class="content">
      <h2>Abwesenheitswarnung</h2>
      
      <div class="warning-box">
        <p>⚠️ Ein Athlet hat auffällig viele unentschuldigte Fehlzeiten.</p>
      </div>

      <div class="info-box">
        <p><span class="info-label">Athlet:</span> ${athlete.firstName} ${athlete.lastName}</p>
        <p><span class="info-label">Unentschuldigte Fehlzeiten:</span> ${absenceCount}</p>
        <p><span class="info-label">Zeitraum:</span> Letzte ${windowDays} Tage</p>
      </div>

      <p>Bitte kontaktieren Sie den Athleten oder die Erziehungsberechtigten, um die Situation zu klären.</p>

      <a href="${process.env.NEXTAUTH_URL}/trainer/athletes" class="button">Zur Athletenverwaltung</a>
    </div>
    <div class="footer">
      <p>Diese E-Mail wurde automatisch vom SV Esting Gymnastics Manager gesendet.</p>
    </div>
  </div>
</body>
</html>
    `,
  };
}

export function getSessionCancellationTemplate(
  sessionInfo: {
    date: string;
    time: string;
    trainingName: string;
  },
  reason?: string
): { subject: string; html: string } {
  return {
    subject: `Training abgesagt: ${sessionInfo.trainingName} am ${sessionInfo.date}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #1a365d; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f8f9fa; }
    .cancel-box { background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .info-box { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; border: 1px solid #e2e8f0; }
    .info-label { font-weight: bold; color: #4a5568; }
    .button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
    .footer { text-align: center; padding: 20px; color: #718096; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SV Esting Turnen</h1>
    </div>
    <div class="content">
      <h2>Training abgesagt</h2>
      
      <div class="cancel-box">
        <p>❌ Das folgende Training wurde abgesagt:</p>
      </div>

      <div class="info-box">
        <p><span class="info-label">Training:</span> ${sessionInfo.trainingName}</p>
        <p><span class="info-label">Datum:</span> ${sessionInfo.date}</p>
        <p><span class="info-label">Zeit:</span> ${sessionInfo.time}</p>
        ${reason ? `<p><span class="info-label">Grund:</span> ${reason}</p>` : ''}
      </div>

      <p>Bitte beachte die Änderung in deinem Trainingsplan.</p>

      <a href="${process.env.NEXTAUTH_URL}/athlete/schedule" class="button">Zum Trainingsplan</a>
    </div>
    <div class="footer">
      <p>Diese E-Mail wurde automatisch vom SV Esting Gymnastics Manager gesendet.</p>
    </div>
  </div>
</body>
</html>
    `,
  };
}

// Helper functions for sending specific notification types
export async function sendRegistrationNotification(athlete: {
  firstName: string;
  lastName: string;
  email: string;
  guardianName?: string | null;
  guardianEmail?: string | null;
}) {
  // Get all admin emails from the database
  const adminEmails = await getAdminEmails();
  
  if (adminEmails.length === 0) {
    console.log('[Email] No admins found in database, skipping registration notification');
    return { success: false, error: 'No admins configured' };
  }

  const template = getRegistrationNotificationTemplate(athlete);
  return sendEmail({
    to: adminEmails,
    ...template,
  });
}

export async function sendApprovalNotification(
  athleteEmail: string,
  athlete: { firstName: string; lastName: string }
) {
  const template = getApprovalNotificationTemplate(athlete);
  return sendEmail({
    to: athleteEmail,
    ...template,
  });
}

export async function sendAbsenceAlert(
  athlete: { firstName: string; lastName: string },
  absenceCount: number,
  windowDays: number
) {
  // Get all admin emails from the database
  const adminEmails = await getAdminEmails();
  
  if (adminEmails.length === 0) {
    console.log('[Email] No admins found in database, skipping absence alert');
    return { success: false, error: 'No admins configured' };
  }

  const template = getAbsenceAlertTemplate(athlete, absenceCount, windowDays);
  return sendEmail({
    to: adminEmails,
    ...template,
  });
}

export async function sendSessionCancellation(
  athleteEmails: string[],
  sessionInfo: { date: string; time: string; trainingName: string },
  reason?: string
) {
  const template = getSessionCancellationTemplate(sessionInfo, reason);
  return sendEmail({
    to: athleteEmails,
    ...template,
  });
}

// ============================================================================
// PASSWORD RESET EMAIL
// ============================================================================

export function getPasswordResetTemplate(
  resetUrl: string,
  firstName: string
): { subject: string; html: string } {
  return {
    subject: 'Passwort zurücksetzen - SV Esting Turnen',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #1a365d; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f8f9fa; }
    .button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .warning { background-color: #fef3cd; border: 1px solid #ffc107; padding: 10px; border-radius: 5px; margin: 15px 0; }
    .footer { text-align: center; padding: 20px; color: #718096; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SV Esting Turnen</h1>
    </div>
    <div class="content">
      <h2>Passwort zurücksetzen</h2>
      <p>Hallo ${firstName},</p>
      <p>du hast angefordert, dein Passwort zurückzusetzen. Klicke auf den folgenden Button, um ein neues Passwort zu wählen:</p>
      
      <p style="text-align: center;">
        <a href="${resetUrl}" class="button">Passwort zurücksetzen</a>
      </p>
      
      <div class="warning">
        <strong>Hinweis:</strong> Dieser Link ist nur 1 Stunde gültig. Falls du kein neues Passwort angefordert hast, kannst du diese E-Mail ignorieren.
      </div>
      
      <p>Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:</p>
      <p style="word-break: break-all; font-size: 12px; color: #666;">${resetUrl}</p>
    </div>
    <div class="footer">
      <p>SV Esting Turnen</p>
      <p>Diese E-Mail wurde automatisch versendet. Bitte antworte nicht darauf.</p>
    </div>
  </div>
</body>
</html>
    `,
  };
}

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string,
  firstName: string
) {
  const template = getPasswordResetTemplate(resetUrl, firstName);
  return sendEmail({
    to: email,
    ...template,
  });
}
