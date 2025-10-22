# API Updates Summary - Phase 1 Complete

## ✅ Completed API Endpoints

### 1. Trainer Session APIs

#### Updated: `GET /api/trainer/sessions/[date]/route.ts`
- **Changes**: Complete restructure to return SessionGroup structure
- **Response now includes**:
  - `sessions.groups[]` - Array of SessionGroups per session
  - Each group contains:
    - `trainingGroup` (name, description, sortOrder)
    - `exercises` and `notes` fields
    - `athletes` array (combined default + temporarily reassigned)
    - `trainerAssignments` for the group
  - Athletes marked with `isTemporarilyReassigned` flag
  - Temporary reassignments include `reassignmentReason` and `movedAt`

#### Updated: `PUT /api/trainer/sessions/[date]/route.ts`
- **Changes**: Modified to update SessionGroup instead of TrainingSession
- **Request body**:
  - `sessionGroupId` (required) - ID of the SessionGroup to update
  - `exercises` - Text field for exercises
  - `notes` - Additional notes
- **Removed**: `equipment1`, `equipment2` (deprecated fields)

#### Created: `POST /api/trainer/sessions/previous-exercises/route.ts`
- **Purpose**: Fetch exercises from the same group 7 days ago
- **Request body**:
  - `recurringTrainingId` - ID of the recurring training
  - `trainingGroupId` - ID of the training group
  - `currentDate` - Current session date
- **Response**: `{ found: boolean, exercises: string, notes: string }`
- **Use case**: Powers "Show previous week" button in UI

#### Created: `POST /api/trainer/sessions/reassign-athlete/route.ts`
- **Purpose**: Move athlete between groups for a single session
- **Request body**:
  - `athleteId` - Athlete to move
  - `fromSessionGroupId` - Source group (optional)
  - `toSessionGroupId` - Target group
  - `reason` - Optional reason for audit trail
- **Creates**: `SessionAthleteAssignment` record with audit trail

#### Created: `DELETE /api/trainer/sessions/reassign-athlete/route.ts`
- **Purpose**: Revert athlete back to their default group
- **Request body**:
  - `athleteId` - Athlete to revert
  - `sessionGroupId` - Group to remove them from
- **Effect**: Removes session-specific assignment (reverts to recurring assignment)

---

### 2. Admin Recurring Training APIs

#### Updated: `POST /api/admin/recurring-trainings/[id]/generate-sessions/route.ts`
- **Changes**: Now creates SessionGroups when generating sessions
- **Process**:
  1. Creates TrainingSession as before
  2. **NEW**: For each TrainingGroup, creates a SessionGroup
  3. **NEW**: Copies trainer assignments from RecurringTrainingTrainerAssignment to SessionGroupTrainerAssignment
- **Result**: Each generated session has proper group structure

#### Created: `GET /api/admin/recurring-trainings/[id]/groups/route.ts`
- **Purpose**: List all groups for a recurring training
- **Response includes**:
  - Group details (name, description, sortOrder)
  - Athlete assignments with athlete info
  - Trainer assignments with trainer info
  - Count of assignments
- **Sorted by**: `sortOrder` ASC

#### Created: `POST /api/admin/recurring-trainings/[id]/groups/route.ts`
- **Purpose**: Create a new group for a recurring training
- **Request body**:
  - `name` (required) - Group name (must be unique within training)
  - `description` (optional) - Group description
  - `sortOrder` (optional) - Sort order (auto-assigned if not provided)
- **Auto-creates**: SessionGroups for all future sessions of this training
- **Validation**: Prevents duplicate group names

#### Created: `GET /api/admin/recurring-trainings/[id]/groups/[groupId]/route.ts`
- **Purpose**: Get details of a specific training group
- **Response includes**:
  - Full group details
  - Recurring training info
  - All athlete assignments with full athlete details
  - All trainer assignments with full trainer details
  - Counts of assignments and session groups

#### Created: `PUT /api/admin/recurring-trainings/[id]/groups/[groupId]/route.ts`
- **Purpose**: Update a training group
- **Request body**:
  - `name` (optional) - New group name
  - `description` (optional) - New description
  - `sortOrder` (optional) - New sort order
- **Validation**: 
  - Ensures group belongs to the specified recurring training
  - Prevents duplicate names

#### Created: `DELETE /api/admin/recurring-trainings/[id]/groups/[groupId]/route.ts`
- **Purpose**: Delete a training group
- **Validation**: Prevents deletion if group has assigned athletes or trainers
- **Cascade**: Automatically deletes associated SessionGroups
- **Safety**: Returns counts if deletion blocked

---

### 3. Admin Athlete Assignment APIs

#### Updated: `POST /api/admin/recurring-trainings/[id]/athletes/route.ts`
- **Changes**: Now assigns athletes to TrainingGroups instead of RecurringTrainings
- **Request body**:
  - `athleteIds` (required) - Array of athlete IDs
  - `trainingGroupId` (required) - Target group ID
- **Validation**: 
  - **NEW**: Prevents athlete from being in multiple groups of the same training
  - Returns conflict details if validation fails
- **Response**: Includes assigned athlete details

#### Updated: `DELETE /api/admin/recurring-trainings/[id]/athletes/route.ts`
- **Changes**: Now removes from TrainingGroup instead of RecurringTraining
- **Query params**:
  - `athleteId` (required)
  - `trainingGroupId` (required) - **NEW**
- **Validation**: Ensures assignment exists and belongs to correct training

---

### 4. Admin Trainer Assignment APIs

#### Updated: `POST /api/admin/recurring-trainings/[id]/trainers/route.ts`
- **Changes**: Now assigns trainers to TrainingGroups instead of RecurringTrainings
- **Request body**:
  - `trainerIds` (required) - Array of trainer IDs
  - `trainingGroupId` (required) - Target group ID
  - `effectiveFrom` (optional) - Start date for assignment
  - `effectiveUntil` (optional) - End date for assignment
- **Behavior**: Replaces existing trainer assignments for the group
- **Response**: Includes assigned trainer details

#### Updated: `DELETE /api/admin/recurring-trainings/[id]/trainers/route.ts`
- **Changes**: Now removes from TrainingGroup instead of RecurringTraining
- **Query params**:
  - `trainerId` (required)
  - `trainingGroupId` (required) - **NEW**
- **Validation**: Ensures assignment exists and belongs to correct training

---

### 5. Admin Recurring Training List API

#### Updated: `GET /api/admin/recurring-trainings/route.ts`
- **Changes**: Now includes groups instead of flat athlete/trainer assignments
- **Response structure**:
  - Each recurring training includes:
    - `groups[]` - Array of TrainingGroups
    - Each group includes athlete/trainer assignments
    - Counts of groups and sessions
- **Sorting**: By dayOfWeek, startTime (removed groupNumber)

#### Updated: `POST /api/admin/recurring-trainings/route.ts`
- **Changes**: Removed `groupNumber` field (deprecated)
- **Request body**: No longer requires `groupNumber`
- **Response**: Includes empty `groups[]` array (admin can add groups separately)

---

## 🔑 Key Features Implemented

### 1. Named Groups System
- ✅ Unlimited custom-named groups per recurring training
- ✅ Groups have sortOrder for consistent display
- ✅ Group names must be unique within a training

### 2. Session-Specific Athlete Reassignments
- ✅ Drag-and-drop support via SessionAthleteAssignment
- ✅ Full audit trail (who moved, when, why)
- ✅ Automatically reverts next week (one-time only)
- ✅ Combines default + temporary assignments in response

### 3. Exercises Per Group
- ✅ Stored in SessionGroup.exercises (text field)
- ✅ Previous week lookup endpoint
- ✅ Can copy from previous week in UI

### 4. Validation Rules
- ✅ Athletes cannot be in 2+ groups of same training
- ✅ Conflict detection with detailed error messages
- ✅ Groups cannot be deleted if they have assignments

### 5. Auto-Session Generation
- ✅ Generates SessionGroups when creating sessions
- ✅ Copies trainer assignments to session level
- ✅ When new group added, creates SessionGroups for future sessions

---

## 📋 API Changes Summary

| Endpoint | Method | Status | Key Changes |
|----------|--------|--------|-------------|
| `/api/trainer/sessions/[date]` | GET | ✅ Updated | Returns SessionGroup structure |
| `/api/trainer/sessions/[date]` | PUT | ✅ Updated | Updates SessionGroup exercises |
| `/api/trainer/sessions/previous-exercises` | POST | ✅ Created | Fetches last week's exercises |
| `/api/trainer/sessions/reassign-athlete` | POST | ✅ Created | Move athlete between groups |
| `/api/trainer/sessions/reassign-athlete` | DELETE | ✅ Created | Revert athlete to default group |
| `/api/admin/recurring-trainings` | GET | ✅ Updated | Includes groups structure |
| `/api/admin/recurring-trainings` | POST | ✅ Updated | Removed groupNumber field |
| `/api/admin/recurring-trainings/[id]/generate-sessions` | POST | ✅ Updated | Creates SessionGroups |
| `/api/admin/recurring-trainings/[id]/groups` | GET | ✅ Created | List all groups |
| `/api/admin/recurring-trainings/[id]/groups` | POST | ✅ Created | Create new group |
| `/api/admin/recurring-trainings/[id]/groups/[groupId]` | GET | ✅ Created | Get group details |
| `/api/admin/recurring-trainings/[id]/groups/[groupId]` | PUT | ✅ Created | Update group |
| `/api/admin/recurring-trainings/[id]/groups/[groupId]` | DELETE | ✅ Created | Delete group |
| `/api/admin/recurring-trainings/[id]/athletes` | POST | ✅ Updated | Assign to TrainingGroup |
| `/api/admin/recurring-trainings/[id]/athletes` | DELETE | ✅ Updated | Remove from TrainingGroup |
| `/api/admin/recurring-trainings/[id]/trainers` | POST | ✅ Updated | Assign to TrainingGroup |
| `/api/admin/recurring-trainings/[id]/trainers` | DELETE | ✅ Updated | Remove from TrainingGroup |

**Total**: 17 endpoints updated or created

---

## ✅ Phase 1 Complete

All backend APIs are now fully restructured to support the new named groups system. The APIs now:

- Return proper SessionGroup structure with exercises
- Support unlimited custom-named groups
- Enable session-specific athlete reassignments
- Provide previous week exercises lookup
- Validate business rules (no duplicate assignments)
- Include full audit trails

**Next Phase**: Frontend component updates to consume these new APIs.
