import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';

// GET - List all trainers
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const trainers = await prisma.trainerProfile.findMany({
    where: { isActive: true },
    include: { user: true },
    orderBy: { user: { lastName: 'asc' } },
  });

  return NextResponse.json({
    data: trainers.map((t) => ({
      id: t.id,
      email: t.user.email,
      firstName: t.user.firstName,
      lastName: t.user.lastName,
      phone: t.user.phone,
      role: t.role,
      isActive: t.isActive,
    })),
  });
}
