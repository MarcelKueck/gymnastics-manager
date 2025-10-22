# Training Structure Restructuring - Implementation Summary

## ✅ COMPLETED CHANGES

### 1. Database Schema Updates (Prisma Schema)
**File**: `prisma/schema.prisma`

#### New Models Created:
- ✅ **TrainingGroup**: Named groups within recurring trainings
  - Replaces the simple `groupNumber` field with proper named groups
  - Fields: `id`, `recurringTrainingId`, `name`, `description`, `sortOrder`
  
- ✅ **SessionGroup**: Instance of a TrainingGroup for a specific session
  - Contains session-specific data like exercises and notes
  - Fields: `id`, `trainingSessionId`, `trainingGroupId`, `exercises`, `notes`
  
- ✅ **SessionGroupTrainerAssignment**: Trainers assigned to specific session groups
  - Allows per-session trainer overrides
  - `trainerId` is nullable for rare "no trainer" cases
  
- ✅ **SessionAthleteAssignment**: One-time athlete reassignments within a session
  - Enables drag-and-drop functionality
  - Fields: `athleteId`, `sessionGroupId`, `movedBy`, `movedAt`, `reason`

#### Modified Models:
- ✅ **RecurringTraining**: Removed `groupNumber` field
  - Now contains multiple `TrainingGroup` children
  
- ✅ **TrainingSession**: Removed `groupNumber`, `equipment1`, `equipment2` fields
  - Now contains multiple `SessionGroup` children
  - Equipment info preserved in notes during migration
  
- ✅ **RecurringTrainingAthleteAssignment**: Changed from `recurringTrainingId` to `trainingGroupId`
  - Athletes now assigned to specific groups, not just trainings
  
- ✅ **RecurringTrainingTrainerAssignment**: Changed from `recurringTrainingId` to `trainingGroupId`
  - Trainers now assigned to specific groups within trainings
  
- ✅ **Athlete**: Added `sessionAthleteAssignments` relation
  - Added index on `birthDate` for age group calculations
  
- ✅ **Trainer**: Updated relations for new structure
  - Added `sessionGroupAssignments` and `sessionAthleteReassignments`

#### Deprecated Models:
- ⚠️ **TrainerSessionAssignment**: Kept for backward compatibility but no longer used
  - Relations removed, exists as standalone legacy table

### 2. Utility Functions Created
**File**: `src/lib/ageGroups.ts`

- ✅ `calculateAgeGroup()`: Auto-calculates age group from birth date
- ✅ `getAgeGroupDefinitions()`: Returns age group definitions for any year
- ✅ `formatAgeGroupDisplay()`: Formats age group with birth years
- ✅ `getAllAgeGroupsWithBirthYears()`: Gets all categories with their years
- ✅ `getAthletesInAgeGroup()`: Filters athletes by age group

Age Groups Supported:
- E-Jugend (2 consecutive birth years)
- D-Jugend (2 consecutive birth years)
- C-Jugend (2 consecutive birth years)
- AB-Jugend (4 consecutive birth years)
- Turnerinnen (all older athletes)

### 3. Migration File Created
**File**: `prisma/migrations/20251022173142_restructure_training_groups_and_sessions/migration.sql`

✅ Migration handles:
1. Creating `TrainingGroup` records from existing `RecurringTraining.groupNumber`
2. Migrating athlete assignments to new structure
3. Migrating trainer assignments to new structure
4. Preserving equipment data in session notes
5. Creating `SessionGroup` records for existing sessions
6. Migrating trainer assignments to session groups
7. Dropping deprecated columns safely

### 4. Documentation Created
- ✅ `MIGRATION_PLAN.md`: Comprehensive migration strategy
- ✅ This implementation summary

---

## 🚧 CHANGES STILL NEEDED

### Phase 1: Run Migration (CRITICAL - DO FIRST)
```bash
cd /home/marcel/gymnastics-manager
npx prisma migrate dev
npx prisma generate
```

### Phase 2: Backend API Updates

#### A. Admin Recurring Training APIs
**Files to Update**:
- `src/app/api/admin/recurring-trainings/route.ts`
- `src/app/api/admin/recurring-trainings/[id]/route.ts`
- `src/app/api/admin/recurring-trainings/[id]/generate-sessions/route.ts`

**Changes Needed**:
1. ✏️ GET recurring trainings: Include `groups` relation
2. ✏️ POST create recurring training: Accept groups array
3. ✏️ PUT update recurring training: Handle group updates
4. ✏️ Session generation: Create SessionGroups for each TrainingGroup
5. ✏️ Add validation: Prevent athlete from being in 2+ groups in same session

**New Endpoints to Create**:
- `POST /api/admin/recurring-trainings/[id]/groups` - Add group to training
- `PUT /api/admin/recurring-trainings/[id]/groups/[groupId]` - Update group
- `DELETE /api/admin/recurring-trainings/[id]/groups/[groupId]` - Delete group
- `POST /api/admin/recurring-trainings/[id]/groups/[groupId]/athletes` - Assign athletes
- `POST /api/admin/recurring-trainings/[id]/groups/[groupId]/trainers` - Assign trainers

#### B. Trainer Session APIs
**Files to Update**:
- `src/app/api/trainer/sessions/[date]/route.ts`
- `src/app/api/trainer/sessions/week/route.ts`

**Changes Needed**:
1. ✏️ GET session: Return SessionGroup structure with exercises
2. ✏️ PUT session: Accept exercises per SessionGroup
3. ✏️ Add ability to retrieve previous week's exercises for each group
4. ✏️ Handle session-specific athlete reassignments

**New Endpoints to Create**:
- `GET /api/trainer/sessions/[sessionId]/groups/[groupId]/previous-exercises`
- `POST /api/trainer/sessions/[sessionId]/reassign-athlete`
  - Body: `{ athleteId, fromGroupId, toGroupId, reason }`

#### C. Athlete Schedule API
**Files to Update**:
- `src/app/api/athlete/schedule/route.ts`

**Changes Needed**:
1. ✏️ Include TrainingGroup names in response
2. ✏️ Include SessionGroup exercises for athlete's groups
3. ✏️ Handle session-specific reassignments (show temp group if moved)

#### D. New Validation Middleware
**File to Create**: `src/lib/validation/trainingAssignments.ts`

**Functions Needed**:
- `validateAthleteGroupAssignment()`: Ensure athlete not in 2+ groups per session
- `validateTrainerAssignment()`: Warn if group has no trainers
- `getAthleteGroupConflicts()`: Check for conflicts across sessions

### Phase 3: Frontend Updates

#### A. Admin Recurring Training Management
**Files to Update**:
- `src/app/trainer/admin/recurring-trainings/page.tsx`
- `src/app/trainer/admin/recurring-trainings/[id]/page.tsx`

**Changes Needed**:
1. ✏️ Update creation form: Add multiple named groups instead of single groupNumber
2. ✏️ Group management UI: Add, edit, delete groups
3. ✏️ Athlete assignment UI: 
   - Show groups per training session
   - Validate no conflicts (athlete in 2+ groups same session)
   - Display warnings visually
4. ✏️ Trainer assignment UI: Assign trainers to specific groups
5. ✏️ Display age groups next to athlete names (auto-calculated)

**New Components to Create**:
- `TrainingGroupManager.tsx`: Manage groups within a recurring training
- `AthleteGroupAssignmentForm.tsx`: Assign athletes with validation
- `TrainerGroupAssignmentForm.tsx`: Assign trainers to groups
- `AgeGroupBadge.tsx`: Display athlete's age group

#### B. Trainer Session View
**Files to Update**:
- `src/app/trainer/sessions/[date]/page.tsx`

**Major Restructure Needed**:
1. ✏️ Display sessions grouped by SessionGroups (not flat list)
2. ✏️ For each SessionGroup:
   - Show group name prominently
   - Exercises text area (large field)
   - "View Last Week" button to show previous exercises
   - List of assigned athletes
   - Trainer assignment dropdown (can be empty)
   - Attendance marking per athlete
3. ✏️ Drag-and-drop zones:
   - Athletes can be dragged between groups within same session
   - Show confirmation modal with reason field
   - Visual indicator for temporarily reassigned athletes
4. ✏️ Display cancellation reasons for athletes who said "no"

**New Components to Create**:
- `SessionGroupCard.tsx`: Display single session group with all features
- `ExerciseEditor.tsx`: Text editor with "show previous week" feature
- `AthleteCard.tsx`: Draggable athlete card with attendance buttons
- `AthleteReassignmentModal.tsx`: Confirm drag-and-drop with reason
- `PreviousExercisesModal.tsx`: Show last week's exercises

#### C. Athlete Schedule View
**Files to Update**:
- `src/app/athlete/schedule/page.tsx`
- `src/app/athlete/profile/page.tsx`

**Changes Needed**:
1. ✏️ Display group names instead of numbers
2. ✏️ Show exercises for each group they're assigned to
3. ✏️ Indicate if temporarily moved to different group
4. ✏️ Display athlete's age group in profile

**New Components**:
- `SessionDetailCard.tsx`: Show session with group name and exercises
- `AthleteAgeGroupDisplay.tsx`: Show current age group

### Phase 4: Testing Requirements

#### Backend Tests
- [ ] Create recurring training with multiple groups
- [ ] Assign athletes to groups (validate no conflicts)
- [ ] Assign trainers to groups
- [ ] Generate sessions and verify SessionGroups created
- [ ] Update exercises for a SessionGroup
- [ ] Retrieve previous week's exercises
- [ ] Reassign athlete temporarily (drag-and-drop)
- [ ] Verify athlete returns to default group next week
- [ ] Test age group calculation for all categories
- [ ] Verify validation prevents duplicate group assignments

#### Frontend Tests
- [ ] Create/edit/delete groups in recurring training
- [ ] UI prevents assigning athlete to 2+ groups same session
- [ ] Drag-and-drop athlete between groups
- [ ] Exercises save and load correctly
- [ ] Previous week exercises display correctly
- [ ] Age groups display correctly and update on Jan 1
- [ ] Cancellation reasons visible to trainers
- [ ] Temporary reassignments show indicators

#### Edge Cases
- [ ] Delete group with assigned athletes (should prevent or reassign)
- [ ] Session with no trainers (should allow but warn)
- [ ] First week of new training (no previous exercises)
- [ ] Athlete moved multiple times in same session
- [ ] Age group boundary testing (around Jan 1)
- [ ] Very long exercise text (test limits)

---

## 📊 PROGRESS TRACKING

### Database & Schema: ✅ 100% Complete
- [x] Prisma schema updated
- [x] Migration file created
- [x] Age group utility created
- [ ] **Migration not yet run** ⚠️

### Backend APIs: 🚧 0% Complete
- [ ] Admin recurring training endpoints
- [ ] Trainer session endpoints
- [ ] Athlete schedule endpoints
- [ ] Validation middleware
- [ ] Session generation logic

### Frontend: 🚧 0% Complete
- [ ] Admin recurring training UI
- [ ] Trainer session UI (major restructure)
- [ ] Athlete schedule UI
- [ ] Age group displays
- [ ] Drag-and-drop functionality

### Testing: 🚧 0% Complete
- [ ] Backend tests
- [ ] Frontend tests
- [ ] Edge case handling

---

## 🚀 RECOMMENDED IMPLEMENTATION ORDER

1. **RUN MIGRATION** (30 mins)
   - Back up database first!
   - Run `npx prisma migrate dev`
   - Verify data migrated correctly

2. **Backend - Admin Recurring Training** (4-5 hours)
   - Update existing endpoints
   - Create new group management endpoints
   - Add validation middleware

3. **Frontend - Admin Recurring Training** (3-4 hours)
   - Update UI for group management
   - Add athlete/trainer assignment with validation

4. **Backend - Session Generation** (2 hours)
   - Update to create SessionGroups
   - Copy trainer assignments

5. **Backend - Trainer Session Endpoints** (3-4 hours)
   - Return SessionGroup structure
   - Handle exercises and reassignments
   - Previous week exercises

6. **Frontend - Trainer Session View** (8-10 hours)
   - Complete UI restructure
   - Exercises editor with history
   - Drag-and-drop implementation

7. **Backend - Athlete Schedule** (1 hour)
   - Update to return groups and exercises

8. **Frontend - Athlete Schedule** (2 hours)
   - Display group names and exercises
   - Show age group

9. **Testing & Bug Fixes** (4-6 hours)
   - Comprehensive testing
   - Edge case handling
   - Performance optimization

**Total Estimated Time: 27-36 hours**

---

## ⚠️ IMPORTANT NOTES

1. **Database Backup**: Create a backup before running migration!
2. **Staging Environment**: Test on staging before production
3. **Gradual Rollout**: Consider feature flags for gradual rollout
4. **User Training**: Trainers/admins need guidance on new drag-and-drop features
5. **Monitor Performance**: SessionGroups add complexity; watch query performance

---

## 🔄 ROLLBACK PLAN

If critical issues arise:
1. Keep backup of pre-migration database
2. The old `TrainerSessionAssignment` table still exists (deprecated)
3. Can create feature flag to toggle between old/new logic
4. Most breaking changes are in the API layer, not database constraints

---

## 📞 QUESTIONS TO CLARIFY

1. **Group Names**: Should there be predefined group names or fully custom?
2. **Equipment**: Should we keep equipment fields or merge into notes?
3. **Max Groups**: Is there a limit on groups per recurring training?
4. **Exercises Field**: Character limit? Rich text or plain text?
5. **Reassignment Audit**: Should we keep full history of all moves or just current?
6. **Age Group Display**: Where exactly should age groups be shown?

---

This summary provides a complete overview of what has been done and what remains. The migration is ready to run, and the implementation can proceed in phases as outlined above.
