import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.FROM_EMAIL || 'noreply@svesting-turnen.de';
const enableEmail = process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true';

/**
 * Send athlete approval email
 */
export async function sendAthleteApprovalEmail(
  athleteEmail: string,
  athleteName: string
) {
  if (!enableEmail) {
    console.log('[Email disabled] Would send approval email to:', athleteEmail);
    return;
  }

  try {
    await resend.emails.send({
      from: fromEmail,
      to: athleteEmail,
      subject: 'Willkommen bei SV Esting Turnen!',
      html: `
        <h1>Hallo ${athleteName},</h1>
        <p>Dein Account wurde genehmigt! Du kannst dich jetzt im Training Portal anmelden.</p>
        <p><a href="${process.env.NEXTAUTH_URL}/login">Zum Login</a></p>
        <p>Viel Erfolg beim Training!</p>
        <p>Dein SV Esting Turnen Team</p>
      `,
    });
  } catch (error) {
    console.error('Failed to send approval email:', error);
  }
}

/**
 * Send absence alert email to trainers
 */
export async function sendAbsenceAlertEmail(
  trainerEmail: string,
  athleteName: string,
  absenceCount: number
) {
  if (!enableEmail) {
    console.log('[Email disabled] Would send absence alert for:', athleteName);
    return;
  }

  try {
    await resend.emails.send({
      from: fromEmail,
      to: trainerEmail,
      subject: `Fehlzeiten-Warnung: ${athleteName}`,
      html: `
        <h1>Fehlzeiten-Warnung</h1>
        <p><strong>${athleteName}</strong> hat <strong>${absenceCount}</strong> aufeinanderfolgende Fehlzeiten.</p>
        <p>Bitte nimm Kontakt auf, um die Gründe zu klären.</p>
        <p><a href="${process.env.NEXTAUTH_URL}/trainer/athletes">Athleten ansehen</a></p>
      `,
    });
  } catch (error) {
    console.error('Failed to send absence alert email:', error);
  }
}

/**
 * Send enhanced absence alert emails (to both athlete and admin)
 */
export async function sendEnhancedAbsenceAlertEmail(params: {
  athleteName: string;
  athleteEmail: string;
  adminEmail: string;
  absenceCount: number;
  periodDays: number;
  sessions: Array<{ date: Date; name: string }>;
}) {
  if (!enableEmail) {
    console.log('[Email disabled] Would send enhanced absence alert for:', params.athleteName);
    return;
  }

  const { athleteName, athleteEmail, adminEmail, absenceCount, periodDays, sessions } = params;

  const sessionsList = sessions
    .map((s) => `<li>${s.name} - ${s.date.toLocaleDateString('de-DE')}</li>`)
    .join('');

  // Email to athlete
  try {
    await resend.emails.send({
      from: fromEmail,
      to: athleteEmail,
      subject: 'Erinnerung: Trainingsabsagen',
      html: `
        <h1>Hallo ${athleteName},</h1>
        <p>Uns ist aufgefallen, dass du in den letzten ${periodDays} Tagen bei <strong>${absenceCount}</strong> Trainingseinheiten nicht erschienen bist, ohne vorher abzusagen.</p>
        
        <p><strong>Betroffene Trainingseinheiten:</strong></p>
        <ul>${sessionsList}</ul>
        
        <p>Bitte denke daran, deine Trainingseinheiten rechtzeitig im Portal abzusagen, wenn du nicht teilnehmen kannst.</p>
        
        <p><a href="${process.env.NEXTAUTH_URL}/athlete/schedule">Zum Trainingsplan</a></p>
        
        <p>Bei Fragen wende dich bitte an deinen Trainer.</p>
        
        <p>Viele Grüße<br>Dein SV Esting Turnen Team</p>
      `,
    });
  } catch (error) {
    console.error('Failed to send absence alert to athlete:', error);
  }

  // Email to admin
  try {
    await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject: `Fehlzeiten-Warnung: ${athleteName}`,
      html: `
        <h1>Fehlzeiten-Warnung</h1>
        <p><strong>${athleteName}</strong> (${athleteEmail}) hat in den letzten ${periodDays} Tagen <strong>${absenceCount}</strong> Trainingseinheiten ohne Absage verpasst.</p>
        
        <p><strong>Betroffene Trainingseinheiten:</strong></p>
        <ul>${sessionsList}</ul>
        
        <p>Bitte nimm ggf. Kontakt auf.</p>
        
        <p><a href="${process.env.NEXTAUTH_URL}/trainer/athletes">Zur Athletenverwaltung</a></p>
      `,
    });
  } catch (error) {
    console.error('Failed to send absence alert to admin:', error);
  }
}

/**
 * Send session cancellation notification
 */
export async function sendSessionCancellationEmail(
  recipients: string[],
  sessionName: string,
  sessionDate: string,
  reason: string
) {
  if (!enableEmail) {
    console.log('[Email disabled] Would send cancellation notification for:', sessionName);
    return;
  }

  try {
    await resend.emails.send({
      from: fromEmail,
      to: recipients,
      subject: `Trainingsausfall: ${sessionName}`,
      html: `
        <h1>Trainingsausfall</h1>
        <p>Das Training <strong>${sessionName}</strong> am <strong>${sessionDate}</strong> fällt aus.</p>
        <p><strong>Grund:</strong> ${reason}</p>
        <p>Weitere Informationen findest du im Training Portal.</p>
        <p><a href="${process.env.NEXTAUTH_URL}">Zum Portal</a></p>
      `,
    });
  } catch (error) {
    console.error('Failed to send cancellation email:', error);
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
) {
  if (!enableEmail) {
    console.log('[Email disabled] Would send password reset to:', email);
    return;
  }

  try {
    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Passwort zurücksetzen',
      html: `
        <h1>Passwort zurücksetzen</h1>
        <p>Du hast eine Anfrage zum Zurücksetzen deines Passworts gestellt.</p>
        <p><a href="${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}">Passwort zurücksetzen</a></p>
        <p>Dieser Link ist 1 Stunde gültig.</p>
        <p>Falls du diese Anfrage nicht gestellt hast, ignoriere diese E-Mail.</p>
      `,
    });
  } catch (error) {
    console.error('Failed to send password reset email:', error);
  }
}

/**
 * Send new registration notification to admins
 */
export async function sendNewRegistrationNotification(
  athleteName: string,
  athleteEmail: string
) {
  if (!enableEmail) {
    console.log('[Email disabled] Would send new registration notification');
    return;
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  try {
    await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject: 'Neue Anmeldung im Training Portal',
      html: `
        <h1>Neue Anmeldung</h1>
        <p><strong>${athleteName}</strong> (${athleteEmail}) hat sich im Training Portal registriert.</p>
        <p>Bitte überprüfe und genehmige die Anmeldung.</p>
        <p><a href="${process.env.NEXTAUTH_URL}/trainer/athletes">Zur Athletenverwaltung</a></p>
      `,
    });
  } catch (error) {
    console.error('Failed to send registration notification:', error);
  }
}