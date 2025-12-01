import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email';
import crypto from 'crypto';

// POST - Admin triggers password reset for a user
export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'Benutzer-ID erforderlich' },
        { status: 400 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Benutzer nicht gefunden' },
        { status: 404 }
      );
    }

    // Delete any existing unused tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
    });

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Token expires in 24 hours for admin-triggered resets
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Create the reset token
    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    // Send the reset email
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    const result = await sendPasswordResetEmail(
      user.email,
      resetUrl,
      user.firstName
    );

    if (!result.success) {
      console.error('[Admin Password Reset] Failed to send email:', result.error);
      return NextResponse.json(
        { error: 'E-Mail konnte nicht gesendet werden' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `E-Mail zum Zurücksetzen des Passworts wurde an ${user.email} gesendet.`,
    });
  } catch (error) {
    console.error('[Admin Password Reset] Error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}
