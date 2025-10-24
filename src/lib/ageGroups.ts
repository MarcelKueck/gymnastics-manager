import { YouthCategory } from '@prisma/client';

/**
 * Calculate age from birthdate
 */
export function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

/**
 * Determine youth category based on age
 * Note: D category includes all athletes 10 years and older, including adults
 */
export function determineYouthCategory(birthDate: Date): YouthCategory {
  const age = calculateAge(birthDate);

  if (age <= 7) {
    return YouthCategory.F;
  } else if (age <= 9) {
    return YouthCategory.E;
  } else {
    // D category includes all athletes 10 and older, including adults
    return YouthCategory.D;
  }
}

/**
 * Check if athlete requires guardian information (under 18)
 */
export function requiresGuardian(birthDate: Date): boolean {
  return calculateAge(birthDate) < 18;
}

/**
 * Get age group description
 */
export function getAgeGroupDescription(category: YouthCategory): string {
  const descriptions: Record<YouthCategory, string> = {
    [YouthCategory.F]: 'F-Jugend (bis 7 Jahre)',
    [YouthCategory.E]: 'E-Jugend (8-9 Jahre)',
    [YouthCategory.D]: 'D-Jugend / Erwachsene (10+ Jahre)',
  };

  return descriptions[category];
}

/**
 * Get age range for category
 */
export function getAgeRangeForCategory(category: YouthCategory): { min: number; max: number | null } {
  const ranges: Record<YouthCategory, { min: number; max: number | null }> = {
    [YouthCategory.F]: { min: 4, max: 7 },
    [YouthCategory.E]: { min: 8, max: 9 },
    [YouthCategory.D]: { min: 10, max: null },
  };

  return ranges[category];
}