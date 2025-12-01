import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const RESET_TOKEN_EXPIRY_HOURS = 24;

/**
 * Generate a secure random token
 */
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create a password reset token for a user and send the reset email
 */
export async function initiatePasswordReset(
  email: string,
  triggeredByAdmin: boolean = false
): Promise<{ success: boolean; message: string }> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    // Don't reveal if user exists or not for security
    return { 
      success: true, 
      message: 'Falls ein Konto mit dieser E-Mail existiert, wurde ein Link zum Zurücksetzen des Passworts gesendet.' 
    };
  }

  // Invalidate any existing tokens for this user
  await prisma.passwordResetToken.updateMany({
    where: {
      userId: user.id,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    data: {
      expiresAt: new Date(), // Expire immediately
    },
  });

  // Create new token
  const token = generateToken();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + RESET_TOKEN_EXPIRY_HOURS);

  await prisma.passwordResetToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt,
    },
  });

  // Send email
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  const emailResult = await sendEmail({
    to: user.email,
    subject: triggeredByAdmin 
      ? 'SV Esting Turnen - Passwort-Zurücksetzung angefordert'
      : 'SV Esting Turnen - Passwort zurücksetzen',
    html: getPasswordResetEmailTemplate(user.firstName, resetUrl, triggeredByAdmin),
  });

  if (!emailResult.success) {
    console.error('Failed to send password reset email:', emailResult.error);
    return { success: false, message: 'E-Mail konnte nicht gesendet werden' };
  }

  return { 
    success: true, 
    message: 'E-Mail zum Zurücksetzen des Passworts wurde gesendet.' 
  };
}

/**
 * Validate a password reset token
 */
export async function validateResetToken(token: string): Promise<{
  valid: boolean;
  userId?: string;
  email?: string;
  error?: string;
}> {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!resetToken) {
    return { valid: false, error: 'Ungültiger oder abgelaufener Link' };
  }

  if (resetToken.usedAt) {
    return { valid: false, error: 'Dieser Link wurde bereits verwendet' };
  }

  if (resetToken.expiresAt < new Date()) {
    return { valid: false, error: 'Dieser Link ist abgelaufen' };
  }

  return { 
    valid: true, 
    userId: resetToken.userId,
    email: resetToken.user.email,
  };
}

/**
 * Reset a user's password using a valid token
 */
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  const validation = await validateResetToken(token);

  if (!validation.valid) {
    return { success: false, message: validation.error || 'Ungültiger Token' };
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, 10);

  // Update password and mark token as used
  await prisma.$transaction([
    prisma.user.update({
      where: { id: validation.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { token },
      data: { usedAt: new Date() },
    }),
  ]);

  return { success: true, message: 'Passwort erfolgreich geändert' };
}

/**
 * Email template for password reset
 */
function getPasswordResetEmailTemplate(
  firstName: string,
  resetUrl: string,
  triggeredByAdmin: boolean
): string {
  const introText = triggeredByAdmin
    ? 'Ein Administrator hat eine Passwort-Zurücksetzung für dein Konto angefordert.'
    : 'Du hast eine Passwort-Zurücksetzung für dein Konto angefordert.';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #1a365d; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f8f9fa; }
    .button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
    .warning { background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 5px; margin: 15px 0; }
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
      <p>${introText}</p>
      <p>Klicke auf den folgenden Button, um ein neues Passwort zu erstellen:</p>
      <p style="text-align: center;">
        <a href="${resetUrl}" class="button" style="color: white;">Passwort zurücksetzen</a>
      </p>
      <div class="warning">
        <strong>⚠️ Wichtig:</strong>
        <ul>
          <li>Dieser Link ist 24 Stunden gültig</li>
          <li>Falls du diese Anfrage nicht gestellt hast, ignoriere diese E-Mail</li>
          <li>Dein aktuelles Passwort bleibt unverändert, bis du ein neues festlegst</li>
        </ul>
      </div>
      <p>Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:</p>
      <p style="word-break: break-all; font-size: 12px; color: #666;">${resetUrl}</p>
    </div>
    <div class="footer">
      <p>SV Esting Turnabteilung</p>
      <p>Diese E-Mail wurde automatisch generiert.</p>
    </div>
  </div>
</body>
</html>
`;
}
