/**
 * Age Group Calculation Utility
 * Automatically determines age groups based on birth year and current date
 */

export type AgeGroupCategory = 'E-Jugend' | 'D-Jugend' | 'C-Jugend' | 'AB-Jugend' | 'Turnerinnen';

export interface AgeGroupDefinition {
  name: AgeGroupCategory;
  birthYears: number[];
  minBirthYear: number;
  maxBirthYear: number | null; // null means "and older"
}

/**
 * Get age group definitions for a given year
 * @param year The year to get definitions for (default: current year)
 */
export function getAgeGroupDefinitions(year?: number): AgeGroupDefinition[] {
  const targetYear = year || new Date().getFullYear();
  
  return [
    {
      name: 'E-Jugend',
      birthYears: [targetYear - 8, targetYear - 9],
      minBirthYear: targetYear - 9,
      maxBirthYear: targetYear - 8,
    },
    {
      name: 'D-Jugend',
      birthYears: [targetYear - 10, targetYear - 11],
      minBirthYear: targetYear - 11,
      maxBirthYear: targetYear - 10,
    },
    {
      name: 'C-Jugend',
      birthYears: [targetYear - 12, targetYear - 13],
      minBirthYear: targetYear - 13,
      maxBirthYear: targetYear - 12,
    },
    {
      name: 'AB-Jugend',
      birthYears: [targetYear - 14, targetYear - 15, targetYear - 16, targetYear - 17],
      minBirthYear: targetYear - 17,
      maxBirthYear: targetYear - 14,
    },
    {
      name: 'Turnerinnen',
      birthYears: [], // All years older than AB-Jugend
      minBirthYear: 0, // Beginning of time
      maxBirthYear: null, // Includes targetYear - 18 and older
    },
  ];
}

/**
 * Calculate the age group for a given birth date
 * @param birthDate The athlete's birth date
 * @param referenceDate The date to calculate from (default: current date)
 */
export function calculateAgeGroup(birthDate: Date, referenceDate?: Date): AgeGroupCategory {
  const refDate = referenceDate || new Date();
  const year = refDate.getFullYear();
  const birthYear = new Date(birthDate).getFullYear();
  
  const definitions = getAgeGroupDefinitions(year);
  
  for (const definition of definitions) {
    if (definition.name === 'Turnerinnen') {
      // Turnerinnen: targetYear - 18 and older
      if (birthYear <= year - 18) {
        return 'Turnerinnen';
      }
    } else {
      if (birthYear >= definition.minBirthYear && 
          (definition.maxBirthYear === null || birthYear <= definition.maxBirthYear)) {
        return definition.name;
      }
    }
  }
  
  // Default fallback (shouldn't happen if logic is correct)
  return 'E-Jugend';
}

/**
 * Get all athletes in a specific age group
 * @param athletes Array of athletes with birthDate
 * @param ageGroup The age group to filter by
 * @param referenceDate The date to calculate from (default: current date)
 */
export function getAthletesInAgeGroup<T extends { birthDate: Date }>(
  athletes: T[],
  ageGroup: AgeGroupCategory,
  referenceDate?: Date
): T[] {
  return athletes.filter(athlete => 
    calculateAgeGroup(athlete.birthDate, referenceDate) === ageGroup
  );
}

/**
 * Get a formatted display string for an age group
 * @param ageGroup The age group category
 * @param year The year to get birth years for (default: current year)
 */
export function formatAgeGroupDisplay(ageGroup: AgeGroupCategory, year?: number): string {
  const targetYear = year || new Date().getFullYear();
  const definitions = getAgeGroupDefinitions(targetYear);
  const definition = definitions.find(d => d.name === ageGroup);
  
  if (!definition) return ageGroup;
  
  if (definition.name === 'Turnerinnen') {
    return `${ageGroup} (${targetYear - 18} und älter)`;
  }
  
  return `${ageGroup} (${definition.birthYears.sort((a, b) => b - a).join('/')})`;
}

/**
 * Get all age group categories with their current birth years
 * @param year The year to get definitions for (default: current year)
 */
export function getAllAgeGroupsWithBirthYears(year?: number): Array<{
  category: AgeGroupCategory;
  displayText: string;
  birthYears: number[];
}> {
  const targetYear = year || new Date().getFullYear();
  const definitions = getAgeGroupDefinitions(targetYear);
  
  return definitions.map(def => ({
    category: def.name,
    displayText: formatAgeGroupDisplay(def.name, targetYear),
    birthYears: def.name === 'Turnerinnen' 
      ? [targetYear - 18] // Just show the cutoff year
      : def.birthYears,
  }));
}
