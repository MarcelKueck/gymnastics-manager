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

// DELETE - Delete user completely
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const { id: userId } = await params;

  try {
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

    // Prevent admin from deleting themselves
    if (userId === session!.user.id) {
      return NextResponse.json(
        { error: 'Du kannst dich nicht selbst löschen' },
        { status: 400 }
      );
    }

    // Check if this user is the only admin
    if (user.trainerProfile?.role === 'ADMIN') {
      const adminCount = await prisma.trainerProfile.count({
        where: { role: 'ADMIN', isActive: true },
      });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Der letzte Admin kann nicht gelöscht werden. Es muss mindestens ein Admin vorhanden sein.' },
          { status: 400 }
        );
      }
    }

    // Get the current admin's trainer profile to reassign records
    const adminTrainerProfile = await prisma.trainerProfile.findUnique({
      where: { userId: session!.user.id },
    });

    if (!adminTrainerProfile) {
      return NextResponse.json(
        { error: 'Admin-Profil nicht gefunden' },
        { status: 500 }
      );
    }

    // Use a transaction to handle all the cleanup and deletion
    await prisma.$transaction(async (tx) => {
      // If the user has a trainer profile, we need to handle all trainer-related references
      if (user.trainerProfile) {
        const trainerProfileId = user.trainerProfile.id;

        // Reassign RecurringTraining.createdBy to the current admin
        await tx.recurringTraining.updateMany({
          where: { createdBy: trainerProfileId },
          data: { createdBy: adminTrainerProfile.id },
        });

        // Reassign RecurringTrainingAthleteAssignment.assignedBy to the current admin
        await tx.recurringTrainingAthleteAssignment.updateMany({
          where: { assignedBy: trainerProfileId },
          data: { assignedBy: adminTrainerProfile.id },
        });

        // Reassign RecurringTrainingTrainerAssignment.assignedBy to the current admin
        await tx.recurringTrainingTrainerAssignment.updateMany({
          where: { assignedBy: trainerProfileId },
          data: { assignedBy: adminTrainerProfile.id },
        });

        // Nullify TrainingSession.cancelledBy (optional field)
        await tx.trainingSession.updateMany({
          where: { cancelledBy: trainerProfileId },
          data: { cancelledBy: null },
        });

        // Reassign SessionAthleteAssignment.movedBy to the current admin
        await tx.sessionAthleteAssignment.updateMany({
          where: { movedBy: trainerProfileId },
          data: { movedBy: adminTrainerProfile.id },
        });

        // Reassign AttendanceRecord.markedBy to the current admin
        await tx.attendanceRecord.updateMany({
          where: { markedBy: trainerProfileId },
          data: { markedBy: adminTrainerProfile.id },
        });

        // Reassign TrainerAttendanceRecord.markedBy to the current admin
        await tx.trainerAttendanceRecord.updateMany({
          where: { markedBy: trainerProfileId },
          data: { markedBy: adminTrainerProfile.id },
        });

        // Reassign Competition.createdBy to the current admin
        await tx.competition.updateMany({
          where: { createdBy: trainerProfileId },
          data: { createdBy: adminTrainerProfile.id },
        });

        // Reassign Upload.uploadedBy to the current admin
        await tx.upload.updateMany({
          where: { uploadedBy: trainerProfileId },
          data: { uploadedBy: adminTrainerProfile.id },
        });

        // Nullify SystemSettings.lastModifiedBy (optional field)
        await tx.systemSettings.updateMany({
          where: { lastModifiedBy: trainerProfileId },
          data: { lastModifiedBy: null },
        });

        // Nullify AbsenceAlert.acknowledgedBy (optional field)
        await tx.absenceAlert.updateMany({
          where: { acknowledgedBy: trainerProfileId },
          data: { acknowledgedBy: null },
        });

        // Reassign AuditLog.performedBy to the current admin
        await tx.auditLog.updateMany({
          where: { performedBy: trainerProfileId },
          data: { performedBy: adminTrainerProfile.id },
        });

        // Nullify MonthlyTrainerSummary.lastModifiedBy (optional field)
        await tx.monthlyTrainerSummary.updateMany({
          where: { lastModifiedBy: trainerProfileId },
          data: { lastModifiedBy: null },
        });

        // Reassign AbsencePeriod.createdBy to the current admin (for trainer-created periods)
        await tx.absencePeriod.updateMany({
          where: { createdBy: trainerProfileId },
          data: { createdBy: adminTrainerProfile.id },
        });

        // Nullify AthleteProfile.approvedBy (optional field)
        await tx.athleteProfile.updateMany({
          where: { approvedBy: trainerProfileId },
          data: { approvedBy: null },
        });
      }

      // Now delete the user - Prisma cascade will handle:
      // - AthleteProfile (and its cascading relations)
      // - TrainerProfile (and its cascading relations like TrainerCancellation, SessionConfirmation, etc.)
      // - PasswordResetTokens
      await tx.user.delete({
        where: { id: userId },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Benutzer erfolgreich gelöscht',
    });
  } catch (err) {
    console.error('[Admin Users] Error deleting user:', err);
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Benutzers' },
      { status: 500 }
    );
  }
}
