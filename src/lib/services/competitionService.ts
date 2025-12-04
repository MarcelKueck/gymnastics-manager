import { prisma } from '@/lib/prisma';
import { YouthCategory, Prisma } from '@prisma/client';
import { YOUTH_CATEGORY_ORDER } from '@/lib/utils/youthCategory';

export const competitionService = {
  /**
   * Get all competitions (for admin view)
   */
  async getAllCompetitions(includeUnpublished = false) {
    return prisma.competition.findMany({
      where: includeUnpublished ? {} : { isPublished: true },
      include: {
        registrations: {
          include: {
            athlete: {
              include: { user: true },
            },
          },
        },
        createdByTrainer: {
          include: { user: true },
        },
      },
      orderBy: { date: 'asc' },
    });
  },

  /**
   * Get upcoming competitions for athletes
   */
  async getUpcomingCompetitions(athleteProfileId?: string) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const competitions = await prisma.competition.findMany({
      where: {
        isPublished: true,
        isCancelled: false,
        date: { gte: now },
      },
      include: {
        registrations: athleteProfileId
          ? {
              where: { athleteId: athleteProfileId },
            }
          : false,
        _count: {
          select: { registrations: true },
        },
      },
      orderBy: { date: 'asc' },
    });

    return competitions.map((comp) => ({
      ...comp,
      isRegistered: athleteProfileId
        ? (comp.registrations as { athleteId: string }[]).length > 0
        : false,
      registrationCount: comp._count.registrations,
    }));
  },

  /**
   * Get past competitions with results
   */
  async getPastCompetitions(athleteProfileId?: string) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return prisma.competition.findMany({
      where: {
        isPublished: true,
        date: { lt: now },
      },
      include: {
        registrations: athleteProfileId
          ? {
              where: { athleteId: athleteProfileId },
            }
          : {
              include: {
                athlete: {
                  include: { user: true },
                },
              },
            },
      },
      orderBy: { date: 'desc' },
    });
  },

  /**
   * Get single competition by ID
   */
  async getCompetitionById(id: string) {
    return prisma.competition.findUnique({
      where: { id },
      include: {
        registrations: {
          include: {
            athlete: {
              include: { user: true },
            },
          },
        },
        createdByTrainer: {
          include: { user: true },
        },
      },
    });
  },

  /**
   * Create a new competition
   */
  async createCompetition(
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
    },
    createdByTrainerId: string
  ) {
    return prisma.competition.create({
      data: {
        ...data,
        entryFee: data.entryFee ? new Prisma.Decimal(data.entryFee) : null,
        createdBy: createdByTrainerId,
      },
    });
  },

  /**
   * Update a competition
   */
  async updateCompetition(
    id: string,
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
      where: { id },
      data: {
        ...data,
        entryFee:
          data.entryFee !== undefined
            ? data.entryFee !== null
              ? new Prisma.Decimal(data.entryFee)
              : null
            : undefined,
      },
    });
  },

  /**
   * Delete a competition
   */
  async deleteCompetition(id: string) {
    return prisma.competition.delete({
      where: { id },
    });
  },

  /**
   * Check if athlete is eligible for a competition
   */
  async isAthleteEligible(
    competitionId: string,
    athleteProfileId: string
  ): Promise<{ eligible: boolean; reason?: string }> {
    const [competition, athlete] = await Promise.all([
      prisma.competition.findUnique({ where: { id: competitionId } }),
      prisma.athleteProfile.findUnique({ where: { id: athleteProfileId } }),
    ]);

    if (!competition) {
      return { eligible: false, reason: 'Wettkampf nicht gefunden' };
    }

    if (!athlete) {
      return { eligible: false, reason: 'Athlet nicht gefunden' };
    }

    if (competition.isCancelled) {
      return { eligible: false, reason: 'Wettkampf wurde abgesagt' };
    }

    // Check DTB ID requirement
    if (competition.requiresDtbId && !athlete.hasDtbId) {
      return { eligible: false, reason: 'DTB-ID erforderlich' };
    }

    // Check youth category
    if (competition.minYouthCategory) {
      const athleteOrder = YOUTH_CATEGORY_ORDER[athlete.youthCategory];
      const minOrder = YOUTH_CATEGORY_ORDER[competition.minYouthCategory];
      if (athleteOrder < minOrder) {
        return {
          eligible: false,
          reason: `Mindestaltersklasse: ${competition.minYouthCategory}-Jugend`,
        };
      }
    }

    if (competition.maxYouthCategory) {
      const athleteOrder = YOUTH_CATEGORY_ORDER[athlete.youthCategory];
      const maxOrder = YOUTH_CATEGORY_ORDER[competition.maxYouthCategory];
      if (athleteOrder > maxOrder) {
        return {
          eligible: false,
          reason: `Maximale Altersklasse: ${competition.maxYouthCategory}-Jugend`,
        };
      }
    }

    // Check registration deadline
    if (competition.registrationDeadline) {
      const now = new Date();
      if (now > competition.registrationDeadline) {
        return { eligible: false, reason: 'Anmeldefrist abgelaufen' };
      }
    }

    // Check max participants
    if (competition.maxParticipants) {
      const registrationCount = await prisma.competitionRegistration.count({
        where: { competitionId },
      });
      if (registrationCount >= competition.maxParticipants) {
        return { eligible: false, reason: 'Maximale Teilnehmerzahl erreicht' };
      }
    }

    return { eligible: true };
  },

  /**
   * Register athlete for a competition
   */
  async registerAthlete(
    competitionId: string,
    athleteProfileId: string,
    notes?: string
  ) {
    // Check eligibility first
    const eligibility = await this.isAthleteEligible(
      competitionId,
      athleteProfileId
    );
    if (!eligibility.eligible) {
      throw new Error(eligibility.reason || 'Nicht teilnahmeberechtigt');
    }

    // Check if already registered
    const existing = await prisma.competitionRegistration.findUnique({
      where: {
        competitionId_athleteId: {
          competitionId,
          athleteId: athleteProfileId,
        },
      },
    });

    if (existing) {
      throw new Error('Bereits für diesen Wettkampf angemeldet');
    }

    return prisma.competitionRegistration.create({
      data: {
        competitionId,
        athleteId: athleteProfileId,
        notes,
      },
    });
  },

  /**
   * Unregister athlete from a competition
   */
  async unregisterAthlete(competitionId: string, athleteProfileId: string) {
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
    });

    if (!competition) {
      throw new Error('Wettkampf nicht gefunden');
    }

    // Check if past registration deadline
    if (competition.registrationDeadline) {
      const now = new Date();
      if (now > competition.registrationDeadline) {
        throw new Error(
          'Abmeldung nach Anmeldefrist nicht mehr möglich'
        );
      }
    }

    return prisma.competitionRegistration.delete({
      where: {
        competitionId_athleteId: {
          competitionId,
          athleteId: athleteProfileId,
        },
      },
    });
  },

  /**
   * Update registration (for results entry by trainers)
   */
  async updateRegistration(
    competitionId: string,
    athleteProfileId: string,
    data: {
      attended?: boolean;
      placement?: number | null;
      score?: number | null;
      notes?: string;
    }
  ) {
    return prisma.competitionRegistration.update({
      where: {
        competitionId_athleteId: {
          competitionId,
          athleteId: athleteProfileId,
        },
      },
      data: {
        ...data,
        score:
          data.score !== undefined
            ? data.score !== null
              ? new Prisma.Decimal(data.score)
              : null
            : undefined,
      },
    });
  },

  /**
   * Get athlete's competition registrations
   */
  async getAthleteRegistrations(athleteProfileId: string) {
    return prisma.competitionRegistration.findMany({
      where: { athleteId: athleteProfileId },
      include: {
        competition: true,
      },
      orderBy: { competition: { date: 'desc' } },
    });
  },
};
