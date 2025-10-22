/**
 * Training Assignment Validation Rules
 * 
 * This module enforces business rules for athlete and trainer assignments to training groups.
 */

import { prisma } from '../prisma';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface GroupAssignment {
  trainingGroupId: string;
  recurringTrainingId: string;
  sessionDate?: Date; // For checking specific sessions
}

/**
 * Validates that an athlete can be assigned to a training group without conflicts.
 * 
 * Rule: An athlete cannot be assigned to multiple groups within the SAME training session.
 * They CAN be assigned to groups across DIFFERENT training sessions.
 * 
 * @param athleteId The athlete to check
 * @param newGroupId The training group to assign them to
 * @returns Validation result with any errors or warnings
 */
export async function validateAthleteGroupAssignment(
  athleteId: string,
  newGroupId: string
): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  // Get the training group being assigned
  const newGroup = await prisma.trainingGroup.findUnique({
    where: { id: newGroupId },
    include: {
      recurringTraining: true,
    },
  });

  if (!newGroup) {
    result.isValid = false;
    result.errors.push('Training group not found');
    return result;
  }

  // Get all current assignments for this athlete
  const existingAssignments = await prisma.recurringTrainingAthleteAssignment.findMany({
    where: { athleteId },
    include: {
      trainingGroup: {
        include: {
          recurringTraining: true,
        },
      },
    },
  });

  // Check for conflicts: Same day of week AND same time slot
  for (const assignment of existingAssignments) {
    const existingTraining = assignment.trainingGroup.recurringTraining;
    const newTraining = newGroup.recurringTraining;

    // Check if they're on the same day
    if (existingTraining.dayOfWeek === newTraining.dayOfWeek) {
      // Check if time slots overlap
      const existingStart = existingTraining.startTime;
      const existingEnd = existingTraining.endTime;
      const newStart = newTraining.startTime;
      const newEnd = newTraining.endTime;

      // If it's the SAME recurring training, that's definitely a conflict
      if (existingTraining.id === newTraining.id) {
        result.isValid = false;
        result.errors.push(
          `Athlete is already assigned to group "${assignment.trainingGroup.name}" in this training session. ` +
          `They cannot be in multiple groups for the same session.`
        );
        continue;
      }

      // Check for time overlap (if times are defined)
      if (existingStart && existingEnd && newStart && newEnd) {
        if (timesOverlap(existingStart, existingEnd, newStart, newEnd)) {
          result.warnings.push(
            `Warning: Athlete is already assigned to "${assignment.trainingGroup.name}" ` +
            `on ${existingTraining.dayOfWeek} from ${existingStart} to ${existingEnd}. ` +
            `This overlaps with the new assignment (${newStart} - ${newEnd}).`
          );
        }
      }
    }
  }

  return result;
}

/**
 * Get all group assignment conflicts for an athlete
 * 
 * @param athleteId The athlete to check
 * @returns List of conflicting assignments
 */
export async function getAthleteGroupConflicts(athleteId: string): Promise<Array<{
  group1: string;
  group2: string;
  training: string;
  dayOfWeek: string;
  time: string;
}>> {
  const conflicts: Array<{
    group1: string;
    group2: string;
    training: string;
    dayOfWeek: string;
    time: string;
  }> = [];

  const assignments = await prisma.recurringTrainingAthleteAssignment.findMany({
    where: { athleteId },
    include: {
      trainingGroup: {
        include: {
          recurringTraining: true,
        },
      },
    },
  });

  // Check each pair of assignments for conflicts
  for (let i = 0; i < assignments.length; i++) {
    for (let j = i + 1; j < assignments.length; j++) {
      const assignment1 = assignments[i];
      const assignment2 = assignments[j];
      
      const training1 = assignment1.trainingGroup.recurringTraining;
      const training2 = assignment2.trainingGroup.recurringTraining;

      // Same training = conflict
      if (training1.id === training2.id) {
        conflicts.push({
          group1: assignment1.trainingGroup.name,
          group2: assignment2.trainingGroup.name,
          training: training1.name,
          dayOfWeek: training1.dayOfWeek,
          time: `${training1.startTime} - ${training1.endTime}`,
        });
      }
      // Same day and overlapping time = warning conflict
      else if (training1.dayOfWeek === training2.dayOfWeek) {
        if (
          training1.startTime && training1.endTime &&
          training2.startTime && training2.endTime &&
          timesOverlap(training1.startTime, training1.endTime, training2.startTime, training2.endTime)
        ) {
          conflicts.push({
            group1: assignment1.trainingGroup.name,
            group2: assignment2.trainingGroup.name,
            training: `${training1.name} & ${training2.name}`,
            dayOfWeek: training1.dayOfWeek,
            time: `${training1.startTime}-${training1.endTime} overlaps ${training2.startTime}-${training2.endTime}`,
          });
        }
      }
    }
  }

  return conflicts;
}

/**
 * Validates trainer assignment to a group
 * Currently just provides warnings if no trainers assigned
 * 
 * @param trainingGroupId The training group
 * @returns Validation result with warnings
 */
export async function validateTrainerAssignment(
  trainingGroupId: string
): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  const trainerCount = await prisma.recurringTrainingTrainerAssignment.count({
    where: { trainingGroupId },
  });

  if (trainerCount === 0) {
    result.warnings.push(
      'This group has no trainers assigned. It is recommended to assign at least one trainer.'
    );
  }

  return result;
}

/**
 * Validates a session-specific athlete reassignment (drag-and-drop)
 * 
 * @param athleteId The athlete being moved
 * @param trainingSessionId The session
 * @param toGroupId The destination group
 * @returns Validation result
 */
export async function validateSessionAthleteReassignment(
  athleteId: string,
  trainingSessionId: string,
  toGroupId: string
): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  // Check if athlete is already reassigned in this session
  const existingReassignment = await prisma.sessionAthleteAssignment.findUnique({
    where: {
      trainingSessionId_athleteId: {
        trainingSessionId,
        athleteId,
      },
    },
  });

  if (existingReassignment) {
    result.warnings.push(
      'This athlete has already been moved in this session. The previous reassignment will be replaced.'
    );
  }

  // Check if target group exists in this session
  const sessionGroup = await prisma.sessionGroup.findFirst({
    where: {
      trainingSessionId,
      trainingGroupId: toGroupId,
    },
  });

  if (!sessionGroup) {
    result.isValid = false;
    result.errors.push('Target group does not exist in this session');
    return result;
  }

  return result;
}

/**
 * Helper function to check if two time ranges overlap
 * Times expected in "HH:MM" format
 */
function timesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const parseTime = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const start1Minutes = parseTime(start1);
  const end1Minutes = parseTime(end1);
  const start2Minutes = parseTime(start2);
  const end2Minutes = parseTime(end2);

  // Check if ranges overlap
  return start1Minutes < end2Minutes && end1Minutes > start2Minutes;
}

/**
 * Get summary of all assignments for an athlete
 * Useful for displaying in UI
 */
export async function getAthleteAssignmentSummary(athleteId: string): Promise<Array<{
  recurringTrainingId: string;
  recurringTrainingName: string;
  dayOfWeek: string;
  time: string;
  groupId: string;
  groupName: string;
}>> {
  const assignments = await prisma.recurringTrainingAthleteAssignment.findMany({
    where: { athleteId },
    include: {
      trainingGroup: {
        include: {
          recurringTraining: true,
        },
      },
    },
    orderBy: [
      { trainingGroup: { recurringTraining: { dayOfWeek: 'asc' } } },
      { trainingGroup: { recurringTraining: { startTime: 'asc' } } },
    ],
  });

  return assignments.map((assignment) => ({
    recurringTrainingId: assignment.trainingGroup.recurringTraining.id,
    recurringTrainingName: assignment.trainingGroup.recurringTraining.name,
    dayOfWeek: assignment.trainingGroup.recurringTraining.dayOfWeek,
    time: `${assignment.trainingGroup.recurringTraining.startTime} - ${assignment.trainingGroup.recurringTraining.endTime}`,
    groupId: assignment.trainingGroup.id,
    groupName: assignment.trainingGroup.name,
  }));
}
