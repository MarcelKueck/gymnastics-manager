import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateRoleSchema = z.object({
  action: z.enum(['add-trainer', 'remove-trainer', 'make-admin', 'remove-admin']),
});

// PATCH - Update user role
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const userId = params.id;

  try {
    const body = await request.json();
    const validation = updateRoleSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Ungültige Aktion' },
        { status: 400 }
      );
    }

    const { action } = validation.data;

    // Get the user with their profiles
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        trainerProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Benutzer nicht gefunden' },
        { status: 404 }
      );
    }

    // Prevent admin from removing their own admin role
    if (action === 'remove-admin' && userId === session!.user.id) {
      return NextResponse.json(
        { error: 'Du kannst deine eigene Admin-Rolle nicht entfernen' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'add-trainer': {
        if (user.isTrainer && user.trainerProfile) {
          // Already a trainer, just make sure they're active
          await prisma.trainerProfile.update({
            where: { id: user.trainerProfile.id },
            data: { isActive: true },
          });
        } else {
          // Create trainer profile
          await prisma.$transaction([
            prisma.user.update({
              where: { id: userId },
              data: { isTrainer: true },
            }),
            prisma.trainerProfile.create({
              data: {
                userId,
                role: 'TRAINER',
                isActive: true,
              },
            }),
          ]);
        }
        break;
      }

      case 'remove-trainer': {
        if (!user.trainerProfile) {
          return NextResponse.json(
            { error: 'Benutzer ist kein Trainer' },
            { status: 400 }
          );
        }

        // Check if this is the only admin
        if (user.trainerProfile.role === 'ADMIN') {
          const adminCount = await prisma.trainerProfile.count({
            where: { role: 'ADMIN', isActive: true },
          });
          if (adminCount <= 1) {
            return NextResponse.json(
              { error: 'Es muss mindestens ein Admin vorhanden sein' },
              { status: 400 }
            );
          }
        }

        // Deactivate trainer profile instead of deleting
        await prisma.$transaction([
          prisma.user.update({
            where: { id: userId },
            data: { isTrainer: false },
          }),
          prisma.trainerProfile.update({
            where: { id: user.trainerProfile.id },
            data: { isActive: false },
          }),
        ]);
        break;
      }

      case 'make-admin': {
        if (!user.trainerProfile) {
          // Need to create trainer profile first
          await prisma.$transaction([
            prisma.user.update({
              where: { id: userId },
              data: { isTrainer: true },
            }),
            prisma.trainerProfile.create({
              data: {
                userId,
                role: 'ADMIN',
                isActive: true,
              },
            }),
          ]);
        } else {
          // Update existing trainer profile to admin
          await prisma.trainerProfile.update({
            where: { id: user.trainerProfile.id },
            data: { role: 'ADMIN', isActive: true },
          });
          if (!user.isTrainer) {
            await prisma.user.update({
              where: { id: userId },
              data: { isTrainer: true },
            });
          }
        }
        break;
      }

      case 'remove-admin': {
        if (!user.trainerProfile || user.trainerProfile.role !== 'ADMIN') {
          return NextResponse.json(
            { error: 'Benutzer ist kein Admin' },
            { status: 400 }
          );
        }

        // Check if this is the only admin
        const adminCount = await prisma.trainerProfile.count({
          where: { role: 'ADMIN', isActive: true },
        });
        if (adminCount <= 1) {
          return NextResponse.json(
            { error: 'Es muss mindestens ein Admin vorhanden sein' },
            { status: 400 }
          );
        }

        // Demote to regular trainer
        await prisma.trainerProfile.update({
          where: { id: user.trainerProfile.id },
          data: { role: 'TRAINER' },
        });
        break;
      }
    }

    // Fetch updated user
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        athleteProfile: true,
        trainerProfile: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedUser!.id,
        email: updatedUser!.email,
        firstName: updatedUser!.firstName,
        lastName: updatedUser!.lastName,
        phone: updatedUser!.phone,
        isAthlete: updatedUser!.isAthlete,
        isTrainer: updatedUser!.isTrainer,
        athleteProfile: updatedUser!.athleteProfile
          ? {
              id: updatedUser!.athleteProfile.id,
              status: updatedUser!.athleteProfile.status,
              youthCategory: updatedUser!.athleteProfile.youthCategory,
            }
          : null,
        trainerProfile: updatedUser!.trainerProfile
          ? {
              id: updatedUser!.trainerProfile.id,
              role: updatedUser!.trainerProfile.role,
              isActive: updatedUser!.trainerProfile.isActive,
            }
          : null,
      },
    });
  } catch (err) {
    console.error('[Admin Users] Error updating role:', err);
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren der Rolle' },
      { status: 500 }
    );
  }
}
