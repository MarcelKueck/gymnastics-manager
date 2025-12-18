import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// BUG FIX #5: Added 'add-athlete' and 'remove-athlete' actions
const updateRoleSchema = z.object({
  action: z.enum(['add-trainer', 'remove-trainer', 'make-admin', 'remove-admin', 'add-athlete', 'remove-athlete']),
});

// PATCH - Update user role
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const { id: userId } = await params;

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
        athleteProfile: true,
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

      // BUG FIX #5: New action to add athlete role to existing user
      case 'add-athlete': {
        if (user.isAthlete && user.athleteProfile) {
          // Already an athlete, just make sure they're active
          await prisma.athleteProfile.update({
            where: { id: user.athleteProfile.id },
            data: { status: 'ACTIVE' },
          });
        } else {
          // Create athlete profile
          // Get the admin's trainer profile ID for approval
          const adminTrainerProfile = await prisma.trainerProfile.findFirst({
            where: { userId: session!.user.id },
          });

          await prisma.$transaction([
            prisma.user.update({
              where: { id: userId },
              data: { isAthlete: true },
            }),
            prisma.athleteProfile.create({
              data: {
                userId,
                status: 'ACTIVE',
                isApproved: true,
                approvedBy: adminTrainerProfile?.id || null,
                approvedAt: new Date(),
              },
            }),
          ]);
        }
        break;
      }

      // BUG FIX #5: New action to remove athlete role from existing user
      case 'remove-athlete': {
        if (!user.athleteProfile) {
          return NextResponse.json(
            { error: 'Benutzer ist kein Athlet' },
            { status: 400 }
          );
        }

        // Deactivate athlete profile instead of deleting (preserves history)
        await prisma.$transaction([
          prisma.user.update({
            where: { id: userId },
            data: { isAthlete: false },
          }),
          prisma.athleteProfile.update({
            where: { id: user.athleteProfile.id },
            data: { status: 'INACTIVE' },
          }),
        ]);
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
        createdAt: updatedUser!.createdAt.toISOString(),
      },
    });
  } catch (err) {
    console.error('Error updating user role:', err);
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren der Rolle' },
      { status: 500 }
    );
  }
}

// DELETE - Delete user completely
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const { id: userId } = await params;

  try {
    // Prevent admin from deleting themselves
    if (userId === session!.user.id) {
      return NextResponse.json(
        { error: 'Du kannst dich nicht selbst löschen' },
        { status: 400 }
      );
    }

    // Get the user to check if they're an admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { trainerProfile: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Benutzer nicht gefunden' },
        { status: 404 }
      );
    }

    // Check if this is the only admin
    if (user.trainerProfile?.role === 'ADMIN') {
      const adminCount = await prisma.trainerProfile.count({
        where: { role: 'ADMIN', isActive: true },
      });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Der letzte Admin kann nicht gelöscht werden' },
          { status: 400 }
        );
      }
    }

    // Delete user (cascades to profiles due to onDelete: Cascade)
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      success: true,
      message: 'Benutzer erfolgreich gelöscht',
    });
  } catch (err) {
    console.error('Error deleting user:', err);
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Benutzers' },
      { status: 500 }
    );
  }
}