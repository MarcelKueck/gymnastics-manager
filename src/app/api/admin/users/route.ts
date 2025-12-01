import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';

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
