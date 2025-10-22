# Admin Athlete Configuration - Updated to Named Groups System

## Summary
Updated the athlete detail page and configuration modal to work with the new named groups system. Admin/trainers can now assign athletes to TrainingGroups instead of the old day/hour/groupNumber system.

## Changes Made

### 1. Athlete Detail Page (`/trainer/athletes/[id]/page.tsx`)
**Updated interface:**
- Changed `groupAssignments` from old structure (groupNumber, trainingDay, hourNumber) to new structure (trainingId, trainingName, groupId, groupName, trainingDay, startTime, endTime)

**Updated display:**
- Shows training name and group name
- Displays time range (start - end)
- Better visual hierarchy with teal highlight for group names
- Shows "Keine Gruppen zugewiesen" when no assignments

### 2. Athlete Detail API (`/api/trainer/athletes/[id]/route.ts`)
**Completely rewritten:**
- Fetches `recurringTrainingAssignments` instead of `groupAssignments`
- Includes nested data: trainingGroup → recurringTraining
- Transforms data to include training and group information
- Returns properly structured group assignments with all relevant fields

### 3. Edit Configuration Modal (NEW: `edit-config-modal-new.tsx`)
**Complete rewrite from scratch:**
- Fetches all available RecurringTrainings with their groups
- Groups trainings by day/time for easy selection
- Checkbox interface for selecting multiple groups
- Shows training name, day, time, and description
- No more manual day/hour/group number selection
- Real-time loading of available trainings

**Key features:**
- Fetches from `/api/admin/recurring-trainings?includeGroups=true`
- Pre-selects athlete's current group assignments
- Allows selection of multiple groups across different trainings
- Visual hierarchy: Training → Groups
- Shows group descriptions when available

### 4. Configuration API (`/api/trainer/athletes/[id]/config/route.ts`)
**Completely rewritten:**
- Accepts `groupIds` array instead of day/hour/group number
- Validates all group IDs exist and are active
- Calculates difference (groups to add/remove)
- Uses transaction for atomic updates:
  1. Update athlete (youthCategory, competitionParticipation, hasDtbId)
  2. Delete old RecurringTrainingAthleteAssignment records
  3. Create new RecurringTrainingAthleteAssignment records
  4. Create audit log with changes
- Returns count of groups added/removed

### 5. Trainer Statistics API (`/api/trainer/statistics/route.ts`)
**Fixed deprecated queries:**
- Changed from `trainerSessionAssignment` to `sessionGroupTrainerAssignment`
- Fixed relation paths: `recurringTraining` → `trainingGroup.recurringTraining`
- Updated all queries to work with new schema structure

## API Endpoints Updated

### GET `/api/trainer/athletes/:id`
**Response structure:**
```typescript
{
  athlete: {
    // ... personal info ...
    groupAssignments: [{
      id: string,
      trainingId: string,
      trainingName: string,
      groupId: string,
      groupName: string,
      trainingDay: string,
      startTime: string,
      endTime: string
    }],
    attendanceStats: { ... }
  }
}
```

### PUT `/api/trainer/athletes/:id/config`
**Request body:**
```typescript
{
  youthCategory: 'F' | 'E' | 'D',
  competitionParticipation: boolean,
  hasDtbId: boolean,
  groupIds: string[]  // Array of TrainingGroup IDs
}
```

**Response:**
```typescript
{
  message: string,
  groupsAdded: number,
  groupsRemoved: number
}
```

## Database Operations

### Old System (Deprecated)
- `AthleteGroupAssignment` table
- Fields: athleteId, groupNumber (1/2/3), trainingDay, hourNumber (1/2)
- Manual tracking of days and hours

### New System (Active)
- `RecurringTrainingAthleteAssignment` table
- Fields: athleteId, trainingGroupId, assignedBy, assignedAt
- Links directly to TrainingGroup
- TrainingGroup links to RecurringTraining with all details

## User Experience Improvements

### Before (Old System)
1. Select days: Monday, Thursday, Friday
2. Select hours per day: 1st hour, 2nd hour
3. Select group number: 1, 2, or 3
4. Configuration was abstract and hard to understand

### After (New System)
1. See all available trainings grouped by day/time
2. See actual group names ("Anfänger", "Fortgeschrittene", etc.)
3. Select specific groups with descriptions
4. Clear visual hierarchy
5. Can assign to multiple groups easily
6. Configuration is intuitive and meaningful

## Migration Notes
- Old `groupAssignments` data is NOT deleted (backward compatibility)
- New system uses `recurringTrainingAssignments` exclusively
- Existing athletes without new assignments will show "Keine Gruppen zugewiesen"
- Admin must reconfigure athletes using the new modal to assign them to TrainingGroups

## Testing Checklist
- ✅ Athlete detail page displays training and group names correctly
- ✅ Edit configuration modal loads available trainings
- ✅ Can select/deselect multiple groups
- ✅ Configuration saves successfully
- ✅ Audit log records changes
- ✅ Group assignments persist across page reloads
- ✅ Trainer statistics page works without errors
- ✅ No TypeScript compilation errors

## Files Modified
1. `/src/app/trainer/athletes/[id]/page.tsx` - Athlete detail page
2. `/src/components/trainer/edit-config-modal-new.tsx` - New configuration modal (CREATED)
3. `/src/app/api/trainer/athletes/[id]/route.ts` - Athlete detail API
4. `/src/app/api/trainer/athletes/[id]/config/route.ts` - Configuration API (COMPLETELY REWRITTEN)
5. `/src/app/api/trainer/statistics/route.ts` - Fixed deprecated queries

## Files Deprecated (Not Deleted)
1. `/src/components/trainer/edit-config-modal.tsx` - Old modal (keep for reference)
2. `/src/app/api/trainer/athletes/[id]/config/route-old.ts.bak` - Old config API backup

## Next Steps
1. Update approval modal to use new configuration system
2. Migrate existing AthleteGroupAssignment data to RecurringTrainingAthleteAssignment
3. Remove deprecated `groupAssignments` references from database queries
4. Add bulk assignment tool for admins
5. Add email notifications for configuration changes (currently removed)
