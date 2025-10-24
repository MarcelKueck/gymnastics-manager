import { trainerRepository } from '@/lib/repositories/trainerRepository';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';

export class TrainerService {
  /**
   * Create new trainer
   */
  async create(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    role?: UserRole;
  }) {
    // Check if email already exists
    const existing = await trainerRepository.findByEmail(data.email);
    if (existing) {
      throw new Error('Ein Trainer mit dieser E-Mail-Adresse existiert bereits');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create trainer
    return trainerRepository.create({
      email: data.email.toLowerCase(),
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      role: data.role || UserRole.TRAINER,
    });
  }

  /**
   * Update trainer profile
   */
  async updateProfile(trainerId: string, data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  }) {
    return trainerRepository.update(trainerId, {
      user: {
        update: data,
      },
    });
  }

  /**
   * Change trainer password
   */
  async changePassword(trainerId: string, currentPassword: string, newPassword: string) {
    const trainer = await trainerRepository.findById(trainerId);
    if (!trainer) {
      throw new Error('Trainer nicht gefunden');
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, trainer.user.passwordHash);
    if (!isValid) {
      throw new Error('Aktuelles Passwort ist falsch');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    return trainerRepository.update(trainerId, {
      user: {
        update: { passwordHash },
      },
    });
  }

  /**
   * Change trainer role (admin only)
   */
  async changeRole(trainerId: string, role: UserRole) {
    return trainerRepository.update(trainerId, { role });
  }

  /**
   * Deactivate trainer
   */
  async deactivate(trainerId: string) {
    return trainerRepository.deactivate(trainerId);
  }

  /**
   * Activate trainer
   */
  async activate(trainerId: string) {
    return trainerRepository.activate(trainerId);
  }

  /**
   * Get all trainers
   */
  async getAll(activeOnly: boolean = true) {
    if (activeOnly) {
      return trainerRepository.findActive();
    }
    return trainerRepository.findMany({
      orderBy: {
        user: {
          lastName: 'asc',
        },
      },
    });
  }

  /**
   * Get trainer details
   */
  async getDetails(trainerId: string) {
    return trainerRepository.findById(trainerId, {
      recurringTrainingAssignments: {
        include: {
          trainingGroup: {
            include: {
              recurringTraining: true,
            },
          },
        },
      },
      monthlyHoursSummaries: {
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        take: 12,
      },
    });
  }

  /**
   * Get trainer's assigned groups
   */
  async getAssignedGroups(trainerId: string) {
    return trainerRepository.getAssignedGroups(trainerId);
  }

  /**
   * Get trainer's upcoming sessions
   */
  async getUpcomingSessions(trainerId: string, limit: number = 10) {
    return trainerRepository.getUpcomingSessions(trainerId, limit);
  }

  /**
   * Get trainer statistics
   */
  async getStatistics(trainerId: string, month?: number, year?: number) {
    return trainerRepository.getStatistics(trainerId, month, year);
  }

  /**
   * Assign trainer to training group
   */
  async assignToGroup(
    trainerId: string,
    trainingGroupId: string,
    assignedBy: string,
    isPrimary: boolean = true
  ) {
    return prisma.recurringTrainingTrainerAssignment.create({
      data: {
        trainerId,
        trainingGroupId,
        assignedBy,
        isPrimary,
      },
    });
  }

  /**
   * Remove trainer from training group
   */
  async removeFromGroup(trainerId: string, trainingGroupId: string) {
    return prisma.recurringTrainingTrainerAssignment.deleteMany({
      where: {
        trainerId,
        trainingGroupId,
      },
    });
  }
}

export const trainerService = new TrainerService();