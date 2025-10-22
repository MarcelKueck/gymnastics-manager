# Training Structure Restructuring - Quick Reference

## 🎯 Key Changes Summary

### What Changed
1. **Groups are now named** (not just numbered 1, 2, 3)
2. **Exercises field added** (text field per group per week)
3. **Previous week exercises** can be viewed
4. **Drag-and-drop athlete reassignment** for one-time changes
5. **Age groups auto-calculate** from birth dates
6. **Better validation** prevents duplicate group assignments

### What Stayed the Same
- Recurring training concept
- Athlete and trainer assignments
- Attendance tracking
- Cancellation system
- Session generation

---

## 📐 New Data Structure

### Before (Old Structure)
```
RecurringTraining
  ├─ groupNumber: 1, 2, or 3
  └─ TrainingSession (generated)
      ├─ groupNumber: 1, 2, or 3
      ├─ equipment1, equipment2
      └─ Athlete assignments (direct)
```

### After (New Structure)
```
RecurringTraining
  └─ TrainingGroup[] (named groups)
      ├─ name: "Anfänger", "Fortgeschrittene", etc.
      ├─ Athlete assignments
      └─ Trainer assignments
      
TrainingSession (generated)
  └─ SessionGroup[] (one per TrainingGroup)
      ├─ exercises (text, editable weekly)
      ├─ notes
      ├─ Trainer assignments (can override)
      └─ SessionAthleteAssignment[] (drag-and-drop moves)
```

---

## 🔄 Migration Details

### What Happens During Migration
1. ✅ `TrainingGroup` created from each `RecurringTraining.groupNumber`
   - "Gruppe 1", "Gruppe 2", "Gruppe 3" names
2. ✅ Athlete assignments migrated to new groups
3. ✅ Trainer assignments migrated to new groups
4. ✅ Equipment data preserved in session notes
5. ✅ `SessionGroup` created for all existing sessions
6. ✅ Trainer assignments migrated to session groups

### What Gets Deleted
- ❌ `RecurringTraining.groupNumber` column
- ❌ `TrainingSession.groupNumber` column
- ❌ `TrainingSession.equipment1` column
- ❌ `TrainingSession.equipment2` column

### What Stays (Deprecated)
- ⚠️ `TrainerSessionAssignment` table (no longer used but kept)

---

## 📋 Key Business Rules

### 1. Athlete Assignment Rules
✅ **ALLOWED:**
- Athlete in multiple groups across **different** sessions
- Example: "Anfänger" on Monday, "Fortgeschrittene" on Thursday

❌ **NOT ALLOWED:**
- Athlete in 2+ groups within **same** session
- Example: Cannot be in both "Gruppe 1" and "Gruppe 2" on Monday 17:00

### 2. Trainer Assignment Rules
✅ **ALLOWED:**
- Group with no trainers (rare, sickness cases)
- Group with multiple trainers
- Trainer assigned to multiple groups

⚠️ **WARNING:**
- Group with no trainers shows warning (not blocked)

### 3. Session-Specific Reassignment
- Trainers can drag athletes between groups **for one session only**
- Next week, athlete returns to default group
- Must provide reason for move
- Only one reassignment per athlete per session

### 4. Age Groups
- **Auto-calculated** from birth date
- Updates automatically on January 1st each year
- Categories:
  - E-Jugend (2 consecutive years)
  - D-Jugend (2 consecutive years)
  - C-Jugend (2 consecutive years)
  - AB-Jugend (4 consecutive years)
  - Turnerinnen (18+ years old)

---

## 🛠️ Files Created/Modified

### New Files Created
- ✅ `src/lib/ageGroups.ts` - Age group calculations
- ✅ `src/lib/validation/trainingAssignments.ts` - Validation rules
- ✅ `MIGRATION_PLAN.md` - Detailed migration strategy
- ✅ `IMPLEMENTATION_STATUS.md` - Progress tracking
- ✅ Migration file: `prisma/migrations/20251022173142_restructure_training_groups_and_sessions/migration.sql`

### Modified Files
- ✅ `prisma/schema.prisma` - Complete schema restructure

### Files Still Needing Updates
See `IMPLEMENTATION_STATUS.md` for complete list of:
- 🚧 API endpoints to update (10+ files)
- 🚧 Frontend components to update (5+ major pages)
- 🚧 New components to create (10+ components)

---

## ⚡ Quick Start Guide

### Step 1: Run Migration (CRITICAL)
```bash
# Backup database first!
cd /home/marcel/gymnastics-manager

# Run migration
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Verify migration success
npx prisma studio
```

### Step 2: Update Backend APIs
Focus order:
1. Admin recurring training endpoints (group management)
2. Session generation (create SessionGroups)
3. Trainer session endpoints (exercises, reassignments)
4. Athlete schedule endpoints (display groups)

### Step 3: Update Frontend
Focus order:
1. Admin recurring training UI (group management)
2. Trainer session UI (complete restructure)
3. Athlete schedule UI (display changes)

### Step 4: Test Thoroughly
- Create new recurring training with named groups
- Assign athletes (test validation)
- Generate sessions
- Enter exercises
- Test drag-and-drop
- Verify age groups display

---

## 🔍 Testing Scenarios

### Critical Paths to Test
1. **Admin Flow:**
   - Create recurring training with 2-3 named groups
   - Assign athletes to different groups
   - Try to assign athlete to 2 groups in same session (should fail)
   - Assign trainers to each group
   - Generate sessions for next 12 weeks

2. **Trainer Flow:**
   - View session with multiple groups
   - Enter exercises for each group
   - View previous week's exercises
   - Mark attendance for athletes
   - Drag athlete from one group to another
   - See cancellation reasons

3. **Athlete Flow:**
   - View schedule with group names
   - See exercises for their groups
   - Cancel a session
   - View age group in profile

### Edge Cases
- First week of new training (no previous exercises)
- Session with no trainers (should show warning)
- Athlete moved multiple times (should replace previous move)
- Age group boundary (January 1st transition)
- Very long exercise text (test character limits)

---

## 📊 Database Schema Reference

### Key New Tables

#### TrainingGroup
```prisma
{
  id: string
  recurringTrainingId: string
  name: string  // "Anfänger", "Fortgeschrittene"
  description: string?
  sortOrder: number
}
```

#### SessionGroup
```prisma
{
  id: string
  trainingSessionId: string
  trainingGroupId: string
  exercises: string?  // Weekly exercises
  notes: string?
}
```

#### SessionAthleteAssignment
```prisma
{
  id: string
  trainingSessionId: string
  sessionGroupId: string
  athleteId: string
  movedBy: string  // Trainer ID
  movedAt: DateTime
  reason: string?
}
```

### Key Modified Tables

#### RecurringTraining
- ❌ Removed: `groupNumber`
- ➕ Added: `groups: TrainingGroup[]` relation

#### TrainingSession  
- ❌ Removed: `groupNumber`, `equipment1`, `equipment2`
- ➕ Added: `groups: SessionGroup[]` relation

---

## 💡 Best Practices

### For Admins
- Use descriptive group names (not just "Gruppe 1")
- Ensure each group has at least 1 trainer
- Review athlete assignments for conflicts
- Update group assignments when athletes improve

### For Trainers
- Enter exercises each week (can reference previous week)
- Only use drag-and-drop for temporary changes
- Provide clear reason when moving athletes
- Mark attendance accurately

### For Developers
- Always validate athlete assignments
- Use transactions for multi-step operations
- Cache previous week exercises for performance
- Index queries by date and session
- Test migration on staging first

---

## 🆘 Troubleshooting

### Migration Failed
1. Check database connection
2. Review migration logs
3. Ensure no conflicting data
4. Try rolling back and re-running

### Validation Errors
1. Check for existing duplicate assignments
2. Verify group exists in session
3. Confirm training times don't overlap

### Performance Issues
1. Add indexes on frequently queried fields
2. Use `include` selectively
3. Paginate large result sets
4. Consider caching for exercises history

---

## 📞 Support & Questions

If you encounter issues:
1. Check `IMPLEMENTATION_STATUS.md` for progress
2. Review `MIGRATION_PLAN.md` for detailed explanations
3. Examine validation rules in `src/lib/validation/trainingAssignments.ts`
4. Test age group logic in `src/lib/ageGroups.ts`

---

## ✅ Pre-Deployment Checklist

- [ ] Database backup created
- [ ] Migration tested on staging
- [ ] All API endpoints updated
- [ ] Frontend components updated
- [ ] Validation rules tested
- [ ] Age group calculation verified
- [ ] Drag-and-drop functionality tested
- [ ] Previous exercises feature tested
- [ ] Edge cases handled
- [ ] Performance tested with real data
- [ ] User documentation prepared
- [ ] Rollback plan documented

---

**Last Updated**: October 22, 2025
**Migration Version**: 20251022173142_restructure_training_groups_and_sessions
