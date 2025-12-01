import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token erforderlich'),
  password: z
    .string()
    .min(8, 'Passwort muss mindestens 8 Zeichen haben')
    .regex(/[A-Z]/, 'Passwort muss mindestens einen Großbuchstaben enthalten')
    .regex(/[a-z]/, 'Passwort muss mindestens einen Kleinbuchstaben enthalten')
    .regex(/[0-9]/, 'Passwort muss mindestens eine Zahl enthalten'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('[Reset Password] Received body:', { token: body.token?.substring(0, 10) + '...', passwordLength: body.password?.length });
    
    const validation = resetPasswordSchema.safeParse(body);
    if (!validation.success) {
      console.log('[Reset Password] Validation errors:', validation.error.errors);
      const errorMessage = validation.error.errors[0]?.message || 'Ungültige Eingabe';
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    const { token, password } = validation.data;

    // Find the token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Ungültiger oder abgelaufener Link' },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (resetToken.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Der Link ist abgelaufen. Bitte fordere einen neuen an.' },
        { status: 400 }
      );
    }

    // Check if token was already used
    if (resetToken.usedAt) {
      return NextResponse.json(
        { error: 'Dieser Link wurde bereits verwendet.' },
        { status: 400 }
      );
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update user password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({
      message: 'Passwort erfolgreich geändert. Du kannst dich jetzt anmelden.',
    });
  } catch (error) {
    console.error('[Reset Password] Error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}

// GET - Validate token
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json(
      { valid: false, error: 'Token fehlt' },
      { status: 400 }
    );
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!resetToken) {
    return NextResponse.json({ valid: false, error: 'Ungültiger Link' });
  }

  if (resetToken.expiresAt < new Date()) {
    return NextResponse.json({ valid: false, error: 'Link abgelaufen' });
  }

  if (resetToken.usedAt) {
    return NextResponse.json({ valid: false, error: 'Link bereits verwendet' });
  }

  return NextResponse.json({ valid: true });
}
