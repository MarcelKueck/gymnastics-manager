# Training Structure Migration Plan

## Overview
This document outlines the structural changes needed to align the gymnastics manager platform with the new training structure requirements.

## Current vs New Structure

### Current Structure (What Exists)
1. ✅ RecurringTraining with fixed `groupNumber` (1, 2, 3)
2. ✅ Basic athlete assignments to recurring trainings
3. ✅ Basic trainer assignments to recurring trainings
4. ✅ TrainingSession generation from templates
5. ✅ Equipment fields (`equipment1`, `equipment2`)
6. ✅ Basic attendance tracking
7. ❌ No named groups (just numbers)
8. ❌ No exercises field
9. ❌ No previous week exercise viewing
10. ❌ No age group automatic calculation
11. ❌ No session-specific athlete reassignment (drag-and-drop)
12. ❌ No multi-group validation per athlete

### New Structure (What's Required)

#### 1. **Named Training Groups**
- **OLD**: RecurringTraining has `groupNumber` (1, 2, 3)
- **NEW**: RecurringTraining has multiple `TrainingGroup` entities with custom names
  - Example: "Anfänger", "Fortgeschrittene", "Wettkampf"
  - Each group can have different athletes and trainers
  - Groups are recurring and stay the same unless changed

#### 2. **Exercises Management**
- **NEW**: `SessionGroup.exercises` field (text)
- Trainers can enter free-text exercises for each group each week
- Must be able to view previous week's exercises for the same group

#### 3. **Athlete Assignment Rules**
- Athlete must be assigned to at least ONE group for ONE training session
- Athlete can be assigned to MULTIPLE groups across different sessions
- Athlete CANNOT be assigned to TWO different groups for the SAME session
- This validation must be enforced in the backend

#### 4. **Session-Specific Overrides**
- **NEW**: `SessionAthleteAssignment` for one-time drag-and-drop moves
- When athletes are sick/absent, trainers can temporarily move them to other groups
- This override only applies to that specific date
- Next week, athletes revert to their default group assignments

#### 5. **Age Groups**
- **NEW**: Automatic calculation based on birth year and current date
- Categories: E-Jugend, D-Jugend, C-Jugend, AB-Jugend, Turnerinnen
- Updates automatically on January 1st each year
- Used for classification and competitions (display-only, not for training assignment)

#### 6. **Trainer Assignment per Group**
- Each group needs at least 1 trainer (but can have multiple)
- Trainers are assigned to groups, not entire sessions
- In rare cases (sickness), can temporarily have no trainer for a specific session

## Database Schema Changes

### New Models

#### `TrainingGroup`
```prisma
model TrainingGroup {
  id                  String
  recurringTrainingId String
  name                String  // "Anfänger", "Fortgeschrittene", etc.
  description         String?
  sortOrder           Int
  
  athleteAssignments  RecurringTrainingAthleteAssignment[]
  trainerAssignments  RecurringTrainingTrainerAssignment[]
  sessionGroups       SessionGroup[]
}
```

#### `SessionGroup`
```prisma
model SessionGroup {
  id                String
  trainingSessionId String
  trainingGroupId   String
  
  exercises         String?  // Weekly exercises (free text)
  notes             String?
  
  trainerAssignments        SessionGroupTrainerAssignment[]
  sessionAthleteAssignments SessionAthleteAssignment[]
}
```

#### `SessionGroupTrainerAssignment`
```prisma
model SessionGroupTrainerAssignment {
  id             String
  sessionGroupId String
  trainerId      String?  // Nullable for rare "no trainer" cases
}
```

#### `SessionAthleteAssignment`
```prisma
model SessionAthleteAssignment {
  id                String
  trainingSessionId String
  sessionGroupId    String
  athleteId         String
  
  movedBy           String   // Trainer who moved the athlete
  movedAt           DateTime
  reason            String?
}
```

### Modified Models

#### `RecurringTraining` - REMOVED `groupNumber`
- Now contains multiple `TrainingGroup` children
- One recurring training can have multiple named groups

#### `TrainingSession` - REMOVED `groupNumber`, `equipment1`, `equipment2`
- Now contains multiple `SessionGroup` children
- Equipment moved to SessionGroup notes if needed

#### `RecurringTrainingAthleteAssignment` - Changed relationship
- Now references `trainingGroupId` instead of `recurringTrainingId`
- This ensures athletes are assigned to specific groups, not just trainings

#### `RecurringTrainingTrainerAssignment` - Changed relationship
- Now references `trainingGroupId` instead of `recurringTrainingId`
- Trainers are assigned to specific groups within a training

## Migration Steps

### Phase 1: Database Migration
1. ✅ Update Prisma schema with new models
2. Create migration script to:
   - Create new `TrainingGroup` records from existing `RecurringTraining.groupNumber`
   - Migrate athlete assignments to new structure
   - Migrate trainer assignments to new structure
   - Create `SessionGroup` records for existing sessions
   - Remove deprecated fields

### Phase 2: Backend API Updates
1. Update `/api/admin/recurring-trainings` endpoints
   - Add group management (create, update, delete groups)
   - Enforce athlete assignment validation
2. Update `/api/trainer/sessions` endpoints
   - Return SessionGroup structure instead of flat sessions
   - Add previous week exercises lookup
   - Handle session-specific athlete reassignments
3. Update `/api/athlete/schedule` endpoints
   - Show which group(s) athlete is assigned to
   - Display exercises for their groups

### Phase 3: Frontend Updates
1. **Admin Dashboard**
   - Update recurring training creation: allow multiple named groups
   - Athlete assignment UI: validate no duplicate group assignments per session
   - Display age groups automatically calculated from birth dates

2. **Trainer Session View**
   - Reorganize UI to show groups within sessions
   - Add exercises text field per group
   - Add "Show last week" button to view previous exercises
   - Implement drag-and-drop athlete reassignment
   - Update trainer assignment per group

3. **Athlete Schedule**
   - Display group names (not just numbers)
   - Show exercises assigned to their group(s)
   - Display age group in profile

### Phase 4: Validation Rules
1. Backend validation:
   - Athlete cannot be assigned to 2+ groups in same session
   - At least 1 trainer per group (warning, not hard block)
   - Session-specific assignments only for that date

2. Frontend validation:
   - Prevent duplicate group assignments in UI
   - Show warnings when moving athletes

## API Endpoints to Update

### To Modify
- `GET /api/admin/recurring-trainings` - Include groups
- `POST /api/admin/recurring-trainings` - Create with groups
- `PUT /api/admin/recurring-trainings/[id]` - Update groups
- `GET /api/trainer/sessions/[date]` - Return SessionGroup structure
- `PUT /api/trainer/sessions/[date]` - Accept exercises and reassignments
- `GET /api/athlete/schedule` - Include group names and exercises

### To Create
- `POST /api/admin/recurring-trainings/[id]/groups` - Add group
- `PUT /api/admin/recurring-trainings/[id]/groups/[groupId]` - Update group
- `DELETE /api/admin/recurring-trainings/[id]/groups/[groupId]` - Delete group
- `POST /api/trainer/sessions/[sessionId]/reassign-athlete` - Drag-and-drop move
- `GET /api/trainer/sessions/[sessionId]/groups/[groupId]/previous-exercises` - Get last week

## UI Components to Update

### Admin Panel
- `src/app/trainer/admin/recurring-trainings/page.tsx` - Add group management
- `src/app/trainer/admin/recurring-trainings/[id]/page.tsx` - Edit groups, assign athletes/trainers to groups

### Trainer Panel
- `src/app/trainer/sessions/[date]/page.tsx` - Complete restructure for groups
  - Show groups as expandable cards
  - Exercises input field per group
  - Drag-and-drop zones for athlete reassignment
  - Trainer dropdown per group

### Athlete Panel
- `src/app/athlete/schedule/page.tsx` - Display group names
- `src/app/athlete/profile/page.tsx` - Display age group

## Testing Checklist

### Functional Tests
- [ ] Create recurring training with multiple named groups
- [ ] Assign athletes to groups (enforce no duplicates per session)
- [ ] Assign trainers to groups
- [ ] Generate sessions and verify SessionGroup creation
- [ ] Enter exercises for a group
- [ ] View previous week's exercises
- [ ] Drag-and-drop athlete to different group (one-time)
- [ ] Verify athlete returns to default group next week
- [ ] Check age group calculation for all categories
- [ ] Verify age groups update on Jan 1st
- [ ] Trainer can set "no trainer" for a specific session

### Edge Cases
- [ ] Athlete assigned to multiple groups across different sessions
- [ ] Attempt to assign athlete to 2 groups in same session (should fail)
- [ ] Delete a group with assigned athletes (cascade or prevent?)
- [ ] Move athlete in session, then try to move again
- [ ] Check exercises field character limits
- [ ] Verify previous exercises shown correctly (or "Keine Übungen" if first week)

## Rollback Plan
If issues arise:
1. Keep old schema in `TrainerSessionAssignment` (deprecated but functional)
2. Add feature flag to toggle between old/new structures
3. Database backup before migration
4. Separate migration branch for testing

## Timeline Estimate
- Phase 1 (DB Migration): 2-3 hours
- Phase 2 (Backend APIs): 4-6 hours  
- Phase 3 (Frontend): 8-12 hours
- Phase 4 (Validation & Testing): 3-4 hours

**Total: 17-25 hours**

## Next Steps
1. Review and approve this migration plan
2. Create database backup
3. Run Prisma migration
4. Implement data migration script
5. Update API endpoints
6. Update UI components
7. Test thoroughly
8. Deploy to staging
9. Final testing
10. Production deployment
