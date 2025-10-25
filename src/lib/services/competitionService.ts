import { prisma } from '@/lib/prisma';
import { YouthCategory } from '@prisma/client';

export class CompetitionService {
  /**
   * Create a new competition
   */
  async createCompetition(
    createdBy: string,
    data: {
      name: string;
      date: Date;
      location: string;
      description?: string;
      minYouthCategory?: YouthCategory;
      maxYouthCategory?: YouthCategory;
      registrationDeadline?: Date;
      maxParticipants?: number;
      requiresDtbId?: boolean;
      entryFee?: number;
      isPublished?: boolean;
    }
  ) {
    return prisma.competition.create({
      data: {
        ...data,
        createdBy,
        isPublished: data.isPublished ?? false,
      },
      include: {
        registrations: {
          include: {
            athlete: {
              include: {
                user: true,
              },
            },
          },
        },
        createdByTrainer: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  /**
   * Update a competition
   */
  async updateCompetition(
    competitionId: string,
    data: {
      name?: string;
      date?: Date;
      location?: string;
      description?: string;
      minYouthCategory?: YouthCategory | null;
      maxYouthCategory?: YouthCategory | null;
      registrationDeadline?: Date | null;
      maxParticipants?: number | null;
      requiresDtbId?: boolean;
      entryFee?: number | null;
      isPublished?: boolean;
      isCancelled?: boolean;
    }
  ) {
    return prisma.competition.update({
      where: { id: competitionId },
      data,
      include: {
        registrations: {
          include: {
            athlete: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Delete a competition
   */
  async deleteCompetition(competitionId: string) {
    return prisma.competition.delete({
      where: { id: competitionId },
    });
  }

  /**
   * Get all competitions (admin/trainer view)
   */
  async getAllCompetitions(filters?: {
    upcoming?: boolean;
    published?: boolean;
  }) {
    const where: any = {};

    if (filters?.upcoming) {
      where.date = { gte: new Date() };
    }

    if (filters?.published !== undefined) {
      where.isPublished = filters.published;
    }

    return prisma.competition.findMany({
      where,
      include: {
        registrations: {
          include: {
            athlete: {
              include: {
                user: true,
              },
            },
          },
        },
        createdByTrainer: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });
  }

  /**
   * Get published competitions for athletes
   */
  async getPublishedCompetitions(athleteId?: string) {
    const competitions = await prisma.competition.findMany({
      where: {
        isPublished: true,
        isCancelled: false,
      },
      include: {
        registrations: athleteId
          ? {
              where: {
                athleteId,
              },
              include: {
                athlete: {
                  include: {
                    user: true,
                  },
                },
              },
            }
          : {
              include: {
                athlete: {
                  include: {
                    user: true,
                  },
                },
              },
            },
        _count: {
          select: {
            registrations: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    return competitions;
  }

  /**
   * Get a single competition by ID
   */
  async getCompetitionById(competitionId: string) {
    return prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        registrations: {
          include: {
            athlete: {
              include: {
                user: true,
              },
            },
          },
          orderBy: {
            registeredAt: 'asc',
          },
        },
        createdByTrainer: {
          include: {
            user: true,
          },
        },
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });
  }

  /**
   * Check if athlete is eligible for competition
   */
  async isAthleteEligible(athleteId: string, competitionId: string): Promise<{
    eligible: boolean;
    reason?: string;
  }> {
    const [athlete, competition] = await Promise.all([
      prisma.athleteProfile.findUnique({
        where: { id: athleteId },
        include: { user: true },
      }),
      prisma.competition.findUnique({
        where: { id: competitionId },
        include: {
          _count: {
            select: { registrations: true },
          },
        },
      }),
    ]);

    if (!athlete) {
      return { eligible: false, reason: 'Athlet nicht gefunden' };
    }

    if (!competition) {
      return { eligible: false, reason: 'Wettkampf nicht gefunden' };
    }

    if (competition.isCancelled) {
      return { eligible: false, reason: 'Wettkampf wurde abgesagt' };
    }

    if (!competition.isPublished) {
      return { eligible: false, reason: 'Wettkampf ist noch nicht veröffentlicht' };
    }

    // Check registration deadline
    if (competition.registrationDeadline && new Date() > competition.registrationDeadline) {
      return { eligible: false, reason: 'Anmeldeschluss ist vorbei' };
    }

    // Check max participants
    if (competition.maxParticipants && competition._count.registrations >= competition.maxParticipants) {
      return { eligible: false, reason: 'Maximale Teilnehmerzahl erreicht' };
    }

    // Check DTB ID requirement
    if (competition.requiresDtbId && !athlete.hasDtbId) {
      return { eligible: false, reason: 'DTB-ID erforderlich' };
    }

    // Check age category restrictions
    const categoryOrder: YouthCategory[] = [YouthCategory.F, YouthCategory.E, YouthCategory.D];
    const athleteCategoryIndex = categoryOrder.indexOf(athlete.youthCategory);

    if (competition.minYouthCategory) {
      const minIndex = categoryOrder.indexOf(competition.minYouthCategory);
      if (athleteCategoryIndex < minIndex) {
        return { eligible: false, reason: `Nur ab ${competition.minYouthCategory}-Jugend` };
      }
    }

    if (competition.maxYouthCategory) {
      const maxIndex = categoryOrder.indexOf(competition.maxYouthCategory);
      if (athleteCategoryIndex > maxIndex) {
        return { eligible: false, reason: `Nur bis ${competition.maxYouthCategory}-Jugend` };
      }
    }

    return { eligible: true };
  }

  /**
   * Register athlete for competition
   */
  async registerAthlete(
    athleteId: string,
    competitionId: string,
    notes?: string
  ) {
    // Check eligibility first
    const eligibility = await this.isAthleteEligible(athleteId, competitionId);
    if (!eligibility.eligible) {
      throw new Error(eligibility.reason);
    }

    // Check if already registered
    const existing = await prisma.competitionRegistration.findUnique({
      where: {
        competitionId_athleteId: {
          competitionId,
          athleteId,
        },
      },
    });

    if (existing) {
      throw new Error('Bereits für diesen Wettkampf angemeldet');
    }

    return prisma.competitionRegistration.create({
      data: {
        competitionId,
        athleteId,
        notes,
      },
      include: {
        competition: true,
        athlete: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  /**
   * Unregister athlete from competition
   */
  async unregisterAthlete(athleteId: string, competitionId: string) {
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
    });

    if (!competition) {
      throw new Error('Wettkampf nicht gefunden');
    }

    // Check if registration deadline has passed
    if (competition.registrationDeadline && new Date() > competition.registrationDeadline) {
      throw new Error('Abmeldung nach Anmeldeschluss nicht möglich');
    }

    return prisma.competitionRegistration.delete({
      where: {
        competitionId_athleteId: {
          competitionId,
          athleteId,
        },
      },
    });
  }

  /**
   * Update registration (attendance, results)
   */
  async updateRegistration(
    registrationId: string,
    data: {
      attended?: boolean;
      placement?: number | null;
      score?: number | null;
      notes?: string;
    }
  ) {
    return prisma.competitionRegistration.update({
      where: { id: registrationId },
      data,
      include: {
        athlete: {
          include: {
            user: true,
          },
        },
        competition: true,
      },
    });
  }

  /**
   * Get athlete's registrations
   */
  async getAthleteRegistrations(athleteId: string, upcomingOnly = false) {
    const where: any = {
      athleteId,
    };

    if (upcomingOnly) {
      where.competition = {
        date: { gte: new Date() },
        isCancelled: false,
      };
    }

    return prisma.competitionRegistration.findMany({
      where,
      include: {
        competition: true,
      },
      orderBy: {
        competition: {
          date: 'asc',
        },
      },
    });
  }
}

export const competitionService = new CompetitionService();
