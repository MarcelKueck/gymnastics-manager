import { YouthCategory } from '@prisma/client';

/**
 * Calculates the youth category (Altersklasse) based on birth date according to DTB rules.
 * 
 * The category is determined by the age the athlete will reach in the current calendar year.
 * This means the category is based on birth year, not actual age on a specific date.
 * 
 * Categories:
 * - F: 6-7 years (born 2018-2019 for 2025)
 * - E: 8-9 years (born 2016-2017 for 2025)
 * - D: 10-11 years (born 2014-2015 for 2025)
 * - C: 12-13 years (born 2012-2013 for 2025)
 * - B: 14-15 years (born 2010-2011 for 2025)
 * - A: 16-17 years (born 2008-2009 for 2025)
 * - ADULT: 18+ years (born 2007 or earlier for 2025)
 * 
 * @param birthDate - The athlete's birth date
 * @param referenceYear - The competition year (defaults to current year)
 * @returns The youth category or null if birth date is not provided or athlete is too young
 */
export function calculateYouthCategory(
  birthDate: Date | string | null | undefined,
  referenceYear?: number
): YouthCategory | null {
  if (!birthDate) {
    return null;
  }

  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  
  // Validate the date
  if (isNaN(birth.getTime())) {
    return null;
  }

  const year = referenceYear ?? new Date().getFullYear();
  const birthYear = birth.getFullYear();
  
  // Age the athlete will reach this calendar year
  const ageThisYear = year - birthYear;

  // Determine category based on age
  if (ageThisYear >= 18) {
    return YouthCategory.ADULT;
  } else if (ageThisYear >= 16) {
    return YouthCategory.A;
  } else if (ageThisYear >= 14) {
    return YouthCategory.B;
  } else if (ageThisYear >= 12) {
    return YouthCategory.C;
  } else if (ageThisYear >= 10) {
    return YouthCategory.D;
  } else if (ageThisYear >= 8) {
    return YouthCategory.E;
  } else if (ageThisYear >= 6) {
    return YouthCategory.F;
  }

  // Too young for any category
  return null;
}

/**
 * Get the age range description for a youth category
 */
export function getYouthCategoryAgeRange(category: YouthCategory): string {
  switch (category) {
    case YouthCategory.F:
      return '6-7 Jahre';
    case YouthCategory.E:
      return '8-9 Jahre';
    case YouthCategory.D:
      return '10-11 Jahre';
    case YouthCategory.C:
      return '12-13 Jahre';
    case YouthCategory.B:
      return '14-15 Jahre';
    case YouthCategory.A:
      return '16-17 Jahre';
    case YouthCategory.ADULT:
      return '18+ Jahre';
    default:
      return '';
  }
}

/**
 * Get the display label for a youth category
 */
export function getYouthCategoryLabel(category: YouthCategory): string {
  switch (category) {
    case YouthCategory.F:
      return 'F-Jugend';
    case YouthCategory.E:
      return 'E-Jugend';
    case YouthCategory.D:
      return 'D-Jugend';
    case YouthCategory.C:
      return 'C-Jugend';
    case YouthCategory.B:
      return 'B-Jugend';
    case YouthCategory.A:
      return 'A-Jugend';
    case YouthCategory.ADULT:
      return 'Turnerinnen';
    default:
      return '';
  }
}

/**
 * Order of youth categories from youngest to oldest
 */
export const YOUTH_CATEGORY_ORDER: Record<YouthCategory, number> = {
  [YouthCategory.F]: 1,
  [YouthCategory.E]: 2,
  [YouthCategory.D]: 3,
  [YouthCategory.C]: 4,
  [YouthCategory.B]: 5,
  [YouthCategory.A]: 6,
  [YouthCategory.ADULT]: 7,
};

/**
 * All youth categories in order
 */
export const ALL_YOUTH_CATEGORIES: YouthCategory[] = [
  YouthCategory.F,
  YouthCategory.E,
  YouthCategory.D,
  YouthCategory.C,
  YouthCategory.B,
  YouthCategory.A,
  YouthCategory.ADULT,
];
