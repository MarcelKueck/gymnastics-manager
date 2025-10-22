# 🚀 Quick API Reference - Named Groups System

## 🎯 Quick Links

### Admin - Group Management
- **List groups**: `GET /api/admin/recurring-trainings/[id]/groups`
- **Create group**: `POST /api/admin/recurring-trainings/[id]/groups`
- **Update group**: `PUT /api/admin/recurring-trainings/[id]/groups/[groupId]`
- **Delete group**: `DELETE /api/admin/recurring-trainings/[id]/groups/[groupId]`

### Admin - Assignments
- **Assign athletes**: `POST /api/admin/recurring-trainings/[id]/athletes` (requires `trainingGroupId`)
- **Remove athlete**: `DELETE /api/admin/recurring-trainings/[id]/athletes?athleteId=...&trainingGroupId=...`
- **Assign trainers**: `POST /api/admin/recurring-trainings/[id]/trainers` (requires `trainingGroupId`)
- **Remove trainer**: `DELETE /api/admin/recurring-trainings/[id]/trainers?trainerId=...&trainingGroupId=...`

### Trainer - Sessions
- **Get sessions**: `GET /api/trainer/sessions/[date]`
- **Update exercises**: `PUT /api/trainer/sessions/[date]` (requires `sessionGroupId`)
- **Previous exercises**: `POST /api/trainer/sessions/previous-exercises`
- **Reassign athlete**: `POST /api/trainer/sessions/reassign-athlete`
- **Revert reassignment**: `DELETE /api/trainer/sessions/reassign-athlete`

### Athlete - View
- **Get schedule**: `GET /api/athlete/schedule`
- **Get dashboard**: `GET /api/athlete/dashboard`

---

## 📦 Common Request Bodies

### Create Group
```json
POST /api/admin/recurring-trainings/[id]/groups
{
  "name": "Wettkampf",
  "description": "Leistungsorientierte Gruppe",
  "sortOrder": 2
}
```

### Assign Athletes to Group
```json
POST /api/admin/recurring-trainings/[id]/athletes
{
  "athleteIds": ["id1", "id2", "id3"],
  "trainingGroupId": "groupId"
}
```

### Update Exercises
```json
PUT /api/trainer/sessions/[date]
{
  "sessionGroupId": "...",
  "exercises": "Aufwärmen: 10 Min\nKrafttraining: ...",
  "notes": "Optional notes"
}
```

### Reassign Athlete
```json
POST /api/trainer/sessions/reassign-athlete
{
  "athleteId": "...",
  "fromSessionGroupId": "...",
  "toSessionGroupId": "...",
  "reason": "Skill level adjustment"
}
```

### Get Previous Exercises
```json
POST /api/trainer/sessions/previous-exercises
{
  "recurringTrainingId": "...",
  "trainingGroupId": "...",
  "currentDate": "2025-10-28"
}
```

---

## 🔄 Data Flow Examples

### Creating a Training with Groups

1. **Create recurring training**:
   ```
   POST /api/admin/recurring-trainings
   → Returns training with empty groups[]
   ```

2. **Add groups**:
   ```
   POST /api/admin/recurring-trainings/[id]/groups (name: "Anfänger")
   POST /api/admin/recurring-trainings/[id]/groups (name: "Fortgeschrittene")
   POST /api/admin/recurring-trainings/[id]/groups (name: "Wettkampf")
   ```

3. **Assign athletes to groups**:
   ```
   POST /api/admin/recurring-trainings/[id]/athletes
   { athleteIds: [...], trainingGroupId: "anfänger-id" }
   ```

4. **Assign trainers to groups**:
   ```
   POST /api/admin/recurring-trainings/[id]/trainers
   { trainerIds: [...], trainingGroupId: "anfänger-id" }
   ```

5. **Generate sessions**:
   ```
   POST /api/admin/recurring-trainings/[id]/generate-sessions
   → Automatically creates SessionGroups for each TrainingGroup
   ```

### Trainer Session Workflow

1. **Load sessions for date**:
   ```
   GET /api/trainer/sessions/2025-10-28
   → Returns sessions with groups[] and athletes[]
   ```

2. **View previous week exercises**:
   ```
   POST /api/trainer/sessions/previous-exercises
   → Returns exercises from 2025-10-21
   ```

3. **Update exercises**:
   ```
   PUT /api/trainer/sessions/[date]
   { sessionGroupId: "...", exercises: "..." }
   ```

4. **Reassign athlete (drag-and-drop)**:
   ```
   POST /api/trainer/sessions/reassign-athlete
   { athleteId: "...", toSessionGroupId: "..." }
   → Athlete moves to new group for this session only
   ```

5. **Next week**: Athlete automatically back in default group

---

## ⚠️ Important Validations

### Athlete Assignment
- ❌ Cannot assign athlete to multiple groups of same training
- ✅ Can assign to multiple groups across different trainings
- ✅ Can temporarily move for single session

### Group Deletion
- ❌ Cannot delete group with assigned athletes
- ❌ Cannot delete group with assigned trainers
- ✅ Must reassign first, then delete

### Session-Specific Reassignments
- ✅ Only affects one session (current session)
- ✅ Automatically reverts next week
- ✅ Requires reason for audit trail

---

## 📊 Response Examples

### GET `/api/trainer/sessions/[date]`
```json
{
  "sessions": [
    {
      "id": "session1",
      "date": "2025-10-28T17:00:00Z",
      "groups": [
        {
          "id": "sessionGroup1",
          "trainingGroup": {
            "name": "Anfänger",
            "sortOrder": 0
          },
          "exercises": "Aufwärmen: 10 Min\nKrafttraining: Liegestütze 3x10",
          "notes": null,
          "athletes": [
            {
              "id": "athlete1",
              "firstName": "Max",
              "lastName": "Mustermann",
              "birthDate": "2015-03-15",
              "isTemporarilyReassigned": false
            },
            {
              "id": "athlete2",
              "firstName": "Lisa",
              "lastName": "Schmidt",
              "birthDate": "2014-07-22",
              "isTemporarilyReassigned": true,
              "reassignmentReason": "Trying advanced group",
              "movedAt": "2025-10-27T14:30:00Z"
            }
          ],
          "trainerAssignments": [...]
        }
      ]
    }
  ]
}
```

### GET `/api/athlete/schedule`
```json
{
  "sessions": [
    {
      "id": "session1",
      "date": "2025-10-28T17:00:00Z",
      "recurringTraining": {
        "name": "Montag - 1. Stunde",
        "startTime": "17:00",
        "endTime": "18:30"
      },
      "athleteGroups": [
        {
          "trainingGroupName": "Anfänger",
          "exercises": "Aufwärmen: 10 Min...",
          "notes": null,
          "isTemporarilyReassigned": false
        }
      ],
      "cancellations": []
    }
  ]
}
```

---

## 🔧 Troubleshooting

### Error: "Some athletes are already assigned to other groups"
**Cause**: Trying to assign athlete to multiple groups of same training  
**Solution**: Remove from existing group first, or use different training

### Error: "Cannot delete group with assigned athletes"
**Cause**: Group has active athlete assignments  
**Solution**: Reassign athletes to other groups first

### Error: "Training group not found"
**Cause**: Invalid `trainingGroupId` or group doesn't belong to specified training  
**Solution**: Verify group ID and recurringTrainingId match

### Empty exercises when fetching previous week
**Response**: `{ found: false, message: "No exercises found from previous week" }`  
**Cause**: No session existed 7 days ago, or exercises not filled in  
**Solution**: Normal behavior, show empty state in UI

---

## 🎯 Database Models Quick Reference

### TrainingGroup
```prisma
model TrainingGroup {
  id                  String
  recurringTrainingId String
  name                String    // "Anfänger", "Wettkampf", etc.
  description         String?
  sortOrder           Int
  
  athleteAssignments  RecurringTrainingAthleteAssignment[]
  trainerAssignments  RecurringTrainingTrainerAssignment[]
  sessionGroups       SessionGroup[]
}
```

### SessionGroup
```prisma
model SessionGroup {
  id                String
  trainingSessionId String
  trainingGroupId   String
  exercises         String?  // Text field
  notes             String?
  
  trainerAssignments        SessionGroupTrainerAssignment[]
  sessionAthleteAssignments SessionAthleteAssignment[]
}
```

### SessionAthleteAssignment
```prisma
model SessionAthleteAssignment {
  id                String
  trainingSessionId String
  sessionGroupId    String
  athleteId         String
  movedBy           String
  movedAt           DateTime
  reason            String?
}
```

---

## ✅ Status: Phase 1 Complete

All APIs implemented and tested ✅  
Zero TypeScript errors ✅  
Database migration successful ✅  
Test data seeded ✅  

**Ready for frontend implementation!** 🚀
