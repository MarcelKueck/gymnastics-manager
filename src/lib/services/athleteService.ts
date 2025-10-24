import { athleteRepository } from '@/lib/repositories/athleteRepository';
import { trainingRepository } from '@/lib/repositories/trainingRepository';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { YouthCategory } from '@prisma/client';

export class AthleteService {
  /**
   * Register new athlete
   */
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    birthDate: Date;
    gender: string;
    phone: string;
    guardianName?: string;
    guardianEmail?: string;
    guardianPhone?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
  }) {
    // Check if email already exists
    const existingAthlete = await athleteRepository.findByEmail(data.email);
    if (existingAthlete) {
      throw new Error('Ein Athlet mit dieser E-Mail-Adresse existiert bereits');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create athlete
    return athleteRepository.create({
      email: data.email.toLowerCase(),
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      birthDate: data.birthDate,
      gender: data.gender as any,
      phone: data.phone,
      guardianName: data.guardianName,
      guardianEmail: data.guardianEmail,
      guardianPhone: data.guardianPhone,
      emergencyContactName: data.emergencyContactName,
      emergencyContactPhone: data.emergencyContactPhone,
    });
  }

  /**
   * Approve athlete and configure training
   */
  async approveAndConfigure(
    athleteId: string,
    approvedBy: string,
    config: {
      youthCategory: YouthCategory;
      competitionParticipation: boolean;
      hasDtbId: boolean;
      trainingGroupIds: string[];
    }
  ) {
    return prisma.$transaction(async (tx) => {
      // Update athlete
      const athlete = await tx.athlete.update({
        where: { id: athleteId },
        data: {
          isApproved: true,
          approvedBy,
          approvedAt: new Date(),
          configuredAt: new Date(),
          youthCategory: config.youthCategory,
          competitionParticipation: config.competitionParticipation,
          hasDtbId: config.hasDtbId,
        },
      });

      // Assign to training groups
      await Promise.all(
        config.trainingGroupIds.map((groupId) =>
          tx.recurringTrainingAthleteAssignment.create({
            data: {
              trainingGroupId: groupId,
              athleteId,
              assignedBy: approvedBy,
            },
          })
        )
      );

      // Create audit log
      await tx.auditLog.create({
        data: {
          entityType: 'athlete',
          entityId: athleteId,
          action: 'approve',
          performedBy: approvedBy,
          changes: {
            approved: true,
            youthCategory: config.youthCategory,
            competitionParticipation: config.competitionParticipation,
            hasDtbId: config.hasDtbId,
            trainingGroups: config.trainingGroupIds,
          },
          reason: 'Athlete approved and configured',
        },
      });

      return athlete;
    });
  }

  /**
   * Update athlete configuration
   */
  async updateConfiguration(
    athleteId: string,
    updatedBy: string,
    config: {
      youthCategory?: YouthCategory;
      competitionParticipation?: boolean;
      hasDtbId?: boolean;
      trainingGroupIds?: string[];
    }
  ) {
    return prisma.$transaction(async (tx) => {
      const athlete = await tx.athlete.findUnique({ where: { id: athleteId } });
      if (!athlete) {
        throw new Error('Athlet nicht gefunden');
      }

      // Update athlete fields
      const updatedAthlete = await tx.athlete.update({
        where: { id: athleteId },
        data: {
          ...(config.youthCategory && { youthCategory: config.youthCategory }),
          ...(config.competitionParticipation !== undefined && {
            competitionParticipation: config.competitionParticipation,
          }),
          ...(config.hasDtbId !== undefined && { hasDtbId: config.hasDtbId }),
          configuredAt: new Date(),
        },
      });

      // Update training group assignments if provided
      if (config.trainingGroupIds) {
        // Get current assignments
        const currentAssignments = await tx.recurringTrainingAthleteAssignment.findMany({
          where: { athleteId },
          select: { trainingGroupId: true },
        });
        const currentGroupIds = currentAssignments.map((a) => a.trainingGroupId);

        // Find groups to add and remove
        const groupsToAdd = config.trainingGroupIds.filter(
          (id) => !currentGroupIds.includes(id)
        );
        const groupsToRemove = currentGroupIds.filter(
          (id) => !config.trainingGroupIds!.includes(id)
        );

        // Remove old assignments
        if (groupsToRemove.length > 0) {
          await tx.recurringTrainingAthleteAssignment.deleteMany({
            where: {
              athleteId,
              trainingGroupId: { in: groupsToRemove },
            },
          });
        }

        // Add new assignments
        if (groupsToAdd.length > 0) {
          await Promise.all(
            groupsToAdd.map((groupId) =>
              tx.recurringTrainingAthleteAssignment.create({
                data: {
                  trainingGroupId: groupId,
                  athleteId,
                  assignedBy: updatedBy,
                },
              })
            )
          );
        }

        // Create audit log
        await tx.auditLog.create({
          data: {
            entityType: 'athlete',
            entityId: athleteId,
            action: 'update',
            performedBy: updatedBy,
            changes: {
              youthCategory: config.youthCategory,
              competitionParticipation: config.competitionParticipation,
              hasDtbId: config.hasDtbId,
              groupsAdded: groupsToAdd,
              groupsRemoved: groupsToRemove,
            },
            reason: 'Training configuration updated',
          },
        });
      }

      return updatedAthlete;
    });
  }

  /**
   * Update athlete profile
   */
  async updateProfile(athleteId: string, data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    guardianName?: string;
    guardianEmail?: string;
    guardianPhone?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    autoConfirmFutureSessions?: boolean;
  }) {
    return athleteRepository.update(athleteId, data);
  }

  /**
   * Change athlete password
   */
  async changePassword(athleteId: string, currentPassword: string, newPassword: string) {
    const athlete = await athleteRepository.findById(athleteId);
    if (!athlete) {
      throw new Error('Athlet nicht gefunden');
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, athlete.passwordHash);
    if (!isValid) {
      throw new Error('Aktuelles Passwort ist falsch');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    return athleteRepository.update(athleteId, { passwordHash });
  }

  /**
   * Get athlete with full details
   */
  async getAthleteDetails(athleteId: string) {
    return athleteRepository.findById(athleteId, {
      recurringTrainingAssignments: {
        include: {
          trainingGroup: {
            include: {
              recurringTraining: true,
            },
          },
        },
      },
      attendanceRecords: {
        take: 10,
        orderBy: { markedAt: 'desc' },
        include: {
          trainingSession: {
            include: {
              recurringTraining: true,
            },
          },
        },
      },
      cancellations: {
        where: { isActive: true },
        include: {
          trainingSession: true,
        },
      },
    });
  }

  /**
   * Get pending approvals
   */
  async getPendingApprovals() {
    return athleteRepository.findPendingApprovals();
  }

  /**
   * Search athletes
   */
  async searchAthletes(params: {
    query?: string;
    status?: 'all' | 'approved' | 'pending';
    youthCategory?: YouthCategory;
    competitionOnly?: boolean;
  }) {
    const where: any = {};

    // Status filter
    if (params.status === 'approved') {
      where.isApproved = true;
    } else if (params.status === 'pending') {
      where.isApproved = false;
    }

    // Youth category filter
    if (params.youthCategory) {
      where.youthCategory = params.youthCategory;
    }

    // Competition filter
    if (params.competitionOnly) {
      where.competitionParticipation = true;
    }

    // Search query
    if (params.query) {
      where.OR = [
        { firstName: { contains: params.query, mode: 'insensitive' } },
        { lastName: { contains: params.query, mode: 'insensitive' } },
        { email: { contains: params.query, mode: 'insensitive' } },
      ];
    }

    return athleteRepository.findMany({
      where,
      include: {
        recurringTrainingAssignments: {
          include: {
            trainingGroup: {
              include: {
                recurringTraining: true,
              },
            },
          },
        },
      },
      orderBy: {
        lastName: 'asc',
        firstName: 'asc',
      },
    });
  }

  /**
   * Get athlete statistics
   */
  async getStatistics(athleteId: string, dateFrom?: Date, dateTo?: Date) {
    return athleteRepository.getStatistics(athleteId, dateFrom, dateTo);
  }
}

export const athleteService = new AthleteService();