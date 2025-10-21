# System Changes Summary

## What Changed

Your gymnastics management system has been completely refactored to implement a **recurring training appointment system** with admin-controlled scheduling.

## Key Features

### ✅ Admin Capabilities
- **Create recurring training appointments** with:
  - Day of week, time, and group number
  - Recurrence interval (weekly, biweekly, monthly)
  - Start and end dates
- **Assign groups of athletes** to recurring trainings
- **Assign 1-2 trainers (Übungsleiter)** to each training
- **Generate training sessions** automatically (12 weeks ahead)
- **Cancel sessions** (single, multiple, or all future sessions)
- Full control over the training schedule

### ✅ Trainer Capabilities
- **Assign athletes** to recurring training groups
- **View sessions** organized by date
- **Mark attendance** for athletes in their assigned sessions
- See which sessions are cancelled by admin
- Only see non-cancelled, active sessions

### ✅ Athlete Capabilities
- **View their training schedule** (only assigned sessions)
- **Cancel individual sessions** with a reason (minimum 10 characters)
- **Undo cancellations** before the session date
- See admin-cancelled sessions clearly marked
- Cannot cancel if admin already cancelled

## New Admin Pages

1. **`/trainer/admin/recurring-trainings`** - Manage all recurring trainings
2. **`/trainer/admin/recurring-trainings/[id]`** - Manage athletes and trainers for specific training

## Updated Pages

- **Trainer Sessions** (`/trainer/sessions`) - Now shows auto-generated sessions
- **Trainer Session Detail** (`/trainer/sessions/[date]`) - Simplified, shows sessions by group
- **Athlete Schedule** (`/athlete/schedule`) - Shows only assigned sessions, handles admin cancellations

## Database Changes

The migration `add_recurring_training_system` was created and applied, adding:
- `RecurringTraining` model
- `RecurringTrainingAthleteAssignment` model
- `RecurringTrainingTrainerAssignment` model
- Updated `TrainingSession` model with cancellation fields

## Removed Concepts

- ❌ "X Trainings" label (was based on old hourNumber concept)
- ❌ Manual hour-based system (1. Stunde, 2. Stunde)
- ❌ Direct group assignments without recurring template

## Next Steps

To use the new system:

1. **As Admin:** Go to `/trainer/admin/recurring-trainings`
2. **Create recurring trainings** for your schedule
3. **Assign athletes** to each training group
4. **Assign 1-2 trainers** as Übungsleiter
5. **Generate sessions** for the next 12 weeks
6. Sessions will automatically appear for trainers and athletes!

## Files Modified/Created

### Created:
- 16 new API routes for recurring training management
- 2 new admin UI pages
- Updated session detail page for trainers
- Documentation files

### Modified:
- Database schema (Prisma)
- Athlete schedule page
- Trainer session pages
- API routes for sessions and athletes

## Documentation

See `/docs/RECURRING_TRAINING_SYSTEM.md` for complete technical documentation.
