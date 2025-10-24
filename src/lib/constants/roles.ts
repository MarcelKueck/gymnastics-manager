import { UserRole } from '@prisma/client';

export const ROLES = {
  ATHLETE: UserRole.ATHLETE,
  TRAINER: UserRole.TRAINER,
  ADMIN: UserRole.ADMIN,
} as const;

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ATHLETE]: 'Athlet',
  [UserRole.TRAINER]: 'Trainer',
  [UserRole.ADMIN]: 'Administrator',
};

export const ROLE_PERMISSIONS = {
  [UserRole.ATHLETE]: {
    canViewOwnSchedule: true,
    canCancelAttendance: true,
    canViewOwnAttendance: true,
    canViewFiles: true,
    canEditOwnProfile: true,
    canApproveAthletes: false,
    canManageTrainings: false,
    canMarkAttendance: false,
    canUploadFiles: false,
    canManageTrainers: false,
    canManageCategories: false,
    canAdjustTrainerHours: false,
  },
  [UserRole.TRAINER]: {
    canViewOwnSchedule: true,
    canCancelAttendance: false,
    canViewOwnAttendance: false,
    canViewFiles: true,
    canEditOwnProfile: true,
    canApproveAthletes: true,
    canManageTrainings: true,
    canMarkAttendance: true,
    canUploadFiles: true,
    canManageTrainers: false,
    canManageCategories: false,
    canAdjustTrainerHours: false,
  },
  [UserRole.ADMIN]: {
    canViewOwnSchedule: true,
    canCancelAttendance: false,
    canViewOwnAttendance: false,
    canViewFiles: true,
    canEditOwnProfile: true,
    canApproveAthletes: true,
    canManageTrainings: true,
    canMarkAttendance: true,
    canUploadFiles: true,
    canManageTrainers: true,
    canManageCategories: true,
    canAdjustTrainerHours: true,
  },
} as const;

export function hasPermission(
  role: UserRole,
  permission: keyof typeof ROLE_PERMISSIONS.ATHLETE
): boolean {
  return ROLE_PERMISSIONS[role][permission];
}

export function isAdmin(role: UserRole): boolean {
  return role === UserRole.ADMIN;
}

export function isTrainerOrAdmin(role: UserRole): boolean {
  return role === UserRole.TRAINER || role === UserRole.ADMIN;
}

export function isAthlete(role: UserRole): boolean {
  return role === UserRole.ATHLETE;
}