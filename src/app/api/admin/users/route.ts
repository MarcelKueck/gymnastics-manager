import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';
import { adminCreateUserSchema } from '@/lib/validation/auth';
import bcrypt from 'bcryptjs';
import { calculateYouthCategory } from '@/lib/utils/youthCategory';

// Generate a random temporary password
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// GET - List all users
export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type'); // 'athlete', 'trainer', or null for all

  const users = await prisma.user.findMany({
    include: {
      athleteProfile: true,
      trainerProfile: true,
    },
    orderBy: { lastName: 'asc' },
  });

  let filteredUsers = users;

  if (type === 'athlete') {
    filteredUsers = users.filter((u) => u.isAthlete);
  } else if (type === 'trainer') {
    filteredUsers = users.filter((u) => u.isTrainer);
  }

  const data = filteredUsers.map((user) => ({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    isAthlete: user.isAthlete,
    isTrainer: user.isTrainer,
    athleteProfile: user.athleteProfile
      ? {
          id: user.athleteProfile.id,
          status: user.athleteProfile.status,
          youthCategory: user.athleteProfile.youthCategory,
        }
      : null,
    trainerProfile: user.trainerProfile
      ? {
          id: user.trainerProfile.id,
          role: user.trainerProfile.role,
          isActive: user.trainerProfile.isActive,
        }
      : null,
    createdAt: user.createdAt.toISOString(),
  }));

  return NextResponse.json({ data });
}

// POST - Create new user (admin only)
export async function POST(request: NextRequest) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();

    // Validate input
    const validation = adminCreateUserSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Ungültige Eingabe', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if email exists
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Diese E-Mail-Adresse ist bereits registriert' },
        { status: 400 }
      );
    }

    // Generate temporary password
    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // Get admin's trainer profile for approval
    const adminTrainerProfile = await prisma.trainerProfile.findUnique({
      where: { userId: session!.user.id },
    });

    // Calculate youth category from birth date
    const birthDate = data.birthDate ? new Date(data.birthDate) : null;
    const youthCategory = calculateYouthCategory(birthDate);

    // Create user with profiles based on selected roles
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        birthDate: birthDate,
        gender: data.gender || null,
        isAthlete: data.isAthlete,
        isTrainer: data.isTrainer,
        // Create athlete profile if isAthlete
        athleteProfile: data.isAthlete
          ? {
              create: {
                status: 'ACTIVE', // Admin-created users are automatically active
                youthCategory: youthCategory || 'F', // Auto-calculated from birth date
                guardianName: data.guardianName || null,
                guardianEmail: data.guardianEmail || null,
                guardianPhone: data.guardianPhone || null,
                emergencyContactName: data.emergencyContactName || null,
                emergencyContactPhone: data.emergencyContactPhone || null,
                isApproved: true,
                approvedBy: adminTrainerProfile?.id || null,
                approvedAt: new Date(),
              },
            }
          : undefined,
        // Create trainer profile if isTrainer
        trainerProfile: data.isTrainer
          ? {
              create: {
                role: data.trainerRole || 'TRAINER',
                isActive: true,
              },
            }
          : undefined,
      },
      include: {
        athleteProfile: true,
        trainerProfile: true,
      },
    });

    // Format response
    const responseData = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      isAthlete: user.isAthlete,
      isTrainer: user.isTrainer,
      athleteProfile: user.athleteProfile
        ? {
            id: user.athleteProfile.id,
            status: user.athleteProfile.status,
            youthCategory: user.athleteProfile.youthCategory,
          }
        : null,
      trainerProfile: user.trainerProfile
        ? {
            id: user.trainerProfile.id,
            role: user.trainerProfile.role,
            isActive: user.trainerProfile.isActive,
          }
        : null,
      createdAt: user.createdAt.toISOString(),
    };

    return NextResponse.json({
      data: responseData,
      tempPassword, // Return temp password so admin can share it with the user
      message: 'Benutzer erfolgreich erstellt',
    });
  } catch (err) {
    console.error('Error creating user:', err);
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Benutzers' },
      { status: 500 }
    );
  }
}
