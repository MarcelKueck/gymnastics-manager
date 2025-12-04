import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';
import { calculateYouthCategory } from '@/lib/utils/youthCategory';

// POST - Update all athlete youth categories based on birth dates
export async function POST() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    // Get all athletes with their users
    const athletes = await prisma.athleteProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            birthDate: true,
          },
        },
      },
    });

    const updates: Array<{
      athleteId: string;
      name: string;
      oldCategory: string;
      newCategory: string;
    }> = [];

    const currentYear = new Date().getFullYear();

    for (const athlete of athletes) {
      const newCategory = calculateYouthCategory(athlete.user.birthDate, currentYear);
      
      if (newCategory && newCategory !== athlete.youthCategory) {
        await prisma.athleteProfile.update({
          where: { id: athlete.id },
          data: { youthCategory: newCategory },
        });

        updates.push({
          athleteId: athlete.id,
          name: `${athlete.user.firstName} ${athlete.user.lastName}`,
          oldCategory: athlete.youthCategory,
          newCategory: newCategory,
        });
      }
    }

    return NextResponse.json({
      message: `${updates.length} Athleten-Kategorien aktualisiert`,
      totalAthletes: athletes.length,
      updatedCount: updates.length,
      updates,
    });
  } catch (err) {
    console.error('Error updating youth categories:', err);
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren der Kategorien' },
      { status: 500 }
    );
  }
}

// GET - Preview category updates without applying them
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const athletes = await prisma.athleteProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            birthDate: true,
          },
        },
      },
    });

    const currentYear = new Date().getFullYear();
    const pendingUpdates: Array<{
      athleteId: string;
      name: string;
      birthDate: string | null;
      currentCategory: string;
      newCategory: string;
    }> = [];

    for (const athlete of athletes) {
      const newCategory = calculateYouthCategory(athlete.user.birthDate, currentYear);
      
      if (newCategory && newCategory !== athlete.youthCategory) {
        pendingUpdates.push({
          athleteId: athlete.id,
          name: `${athlete.user.firstName} ${athlete.user.lastName}`,
          birthDate: athlete.user.birthDate?.toISOString().split('T')[0] || null,
          currentCategory: athlete.youthCategory,
          newCategory: newCategory,
        });
      }
    }

    return NextResponse.json({
      totalAthletes: athletes.length,
      pendingUpdatesCount: pendingUpdates.length,
      pendingUpdates,
      currentYear,
    });
  } catch (err) {
    console.error('Error previewing youth category updates:', err);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Vorschau' },
      { status: 500 }
    );
  }
}
