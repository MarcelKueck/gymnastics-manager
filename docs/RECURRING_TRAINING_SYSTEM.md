# Recurring Training System - Complete Guide

## Overview

The application has been completely refactored to implement a recurring training management system. This replaces the previous manual session creation approach with an admin-controlled, automated recurring training system.

## Key Changes

### Database Schema

**New Models:**
- `RecurringTraining`: Template for recurring training sessions
- `RecurringTrainingAthleteAssignment`: Links athletes to recurring training groups
- `RecurringTrainingTrainerAssignment`: Assigns 1-2 trainers to recurring trainings
- `RecurrenceInterval`: WEEKLY, BIWEEKLY, or MONTHLY

**Updated Models:**
- `TrainingSession`: Now linked to `RecurringTraining` template
  - Added: `recurringTrainingId`, `startTime`, `endTime`
  - Added: `isCancelled`, `cancelledBy`, `cancelledAt`, `cancellationReason`
  - Removed: `hourNumber` (replaced with time-based system)

### Core Workflow

## 1. Admin Creates Recurring Training Template

**Location:** `/trainer/admin/recurring-trainings`

**Steps:**
1. Admin clicks "Neues Training"
2. Fills in:
   - Name (e.g., "Montag - 17:00 - Gruppe 1")
   - Day of week
   - Start time (e.g., 17:00)
   - End time (e.g., 18:30)
   - Group number (1, 2, or 3)
   - Recurrence interval (Weekly, Biweekly, Monthly)
   - Start date
   - Optional end date
3. Template is created

**API:** `POST /api/admin/recurring-trainings`

## 2. Admin Assigns Athletes and Trainers

**Location:** `/trainer/admin/recurring-trainings/[id]`

**Athletes:**
- Admin/Trainer can assign multiple athletes to a recurring training
- Athletes will automatically appear in all generated sessions
- API: `POST /api/admin/recurring-trainings/[id]/athletes`

**Trainers:**
- Admin assigns 1-2 trainers (Übungsleiter) to each recurring training
- First trainer = Primary (Haupttrainer)
- Second trainer = Secondary (optional)
- Trainers can have time-based assignments (effective from/until dates)
- API: `POST /api/admin/recurring-trainings/[id]/trainers`

## 3. Generate Training Sessions

**Location:** `/trainer/admin/recurring-trainings` (per training card)

**Steps:**
1. Admin clicks "Sessions" button on a recurring training card
2. System generates sessions for the next 12 weeks (configurable)
3. Each generated session:
   - Is linked to the recurring training template
   - Inherits assigned athletes
   - Inherits assigned trainers
   - Gets proper date, time, and group information

**API:** `POST /api/admin/recurring-trainings/[id]/generate-sessions`

**Logic:**
- Checks for existing sessions to avoid duplicates
- Respects recurrence interval (weekly, biweekly, monthly)
- Stops at end date if specified
- Can be run multiple times safely

## 4. Trainer/Athlete View Sessions

### Trainer Session View

**Location:** `/trainer/sessions`

**Features:**
- Week-by-week navigation
- Shows all sessions for selected week
- Click on a date to mark attendance
- Only non-cancelled sessions are shown

**Detail Page:** `/trainer/sessions/[date]`
- Shows all training groups for that date
- Athletes organized by their recurring training assignment
- Mark attendance (Present, Absent Excused, Absent Unexcused)
- View athlete cancellations
- Sessions cancelled by admin are clearly marked

### Athlete Schedule View

**Location:** `/athlete/schedule`

**Features:**
- Shows upcoming training sessions (next 30 sessions)
- Only shows sessions the athlete is assigned to
- Can cancel individual sessions with a reason (min 10 characters)
- Can undo cancellations before the session date
- Admin-cancelled sessions are clearly indicated
- Cannot cancel if admin has already cancelled

## 5. Admin Session Cancellation

**API:** `POST /api/admin/sessions/cancel`

**Features:**
- Cancel single session
- Cancel multiple sessions
- Cancel all future sessions for a recurring training
- Requires cancellation reason (min 10 characters)
- Cancelled sessions:
  - Show in trainer view but marked as cancelled
  - Hidden from athlete schedule (if not yet happened)
  - Cannot have attendance marked
  - Athletes are automatically notified

**Restore:** `PUT /api/admin/sessions/cancel`
- Admin can restore cancelled sessions

## API Endpoints

### Admin - Recurring Trainings

```
GET    /api/admin/recurring-trainings          # List all recurring trainings
POST   /api/admin/recurring-trainings          # Create new recurring training
GET    /api/admin/recurring-trainings/[id]     # Get single recurring training
PUT    /api/admin/recurring-trainings/[id]     # Update recurring training
DELETE /api/admin/recurring-trainings/[id]     # Delete recurring training

POST   /api/admin/recurring-trainings/[id]/athletes           # Assign athletes
DELETE /api/admin/recurring-trainings/[id]/athletes?athleteId # Remove athlete

POST   /api/admin/recurring-trainings/[id]/trainers           # Assign trainers (1-2)
DELETE /api/admin/recurring-trainings/[id]/trainers?trainerId # Remove trainer

POST   /api/admin/recurring-trainings/[id]/generate-sessions  # Generate sessions
```

### Admin - Session Cancellation

```
POST /api/admin/sessions/cancel  # Cancel sessions
PUT  /api/admin/sessions/cancel  # Restore cancelled sessions
```

### Trainer - Sessions

```
GET /api/trainer/sessions/week?date=[date]  # Get week overview
GET /api/trainer/sessions/[date]            # Get sessions for specific date
PUT /api/trainer/sessions/[date]            # Save attendance
```

### Athlete - Schedule

```
GET    /api/athlete/schedule           # Get upcoming sessions
POST   /api/athlete/cancellations      # Cancel a session
DELETE /api/athlete/cancellations/[id] # Undo cancellation
```

## Migration from Old System

The old system had:
- `hourNumber` (1 or 2)
- `groupNumber` (1, 2, or 3)
- `dayOfWeek` (MONDAY, THURSDAY, FRIDAY)
- `AthleteGroupAssignment` table

The new system:
- Replaced `hourNumber` with `startTime` and `endTime`
- Kept `groupNumber` and `dayOfWeek`
- Created `RecurringTraining` templates
- Created `RecurringTrainingAthleteAssignment` (replaces `AthleteGroupAssignment`)
- Old `AthleteGroupAssignment` renamed to legacy and kept for potential data migration

## Benefits of New System

1. **Centralized Control:** Admin has full control over training schedule
2. **Consistency:** All sessions follow the same template
3. **Flexibility:** Easy to add/remove athletes from training groups
4. **Trainer Management:** Clear assignment of 1-2 trainers per training
5. **Cancellation Control:** Only admin can cancel sessions (not individual athletes backing out)
6. **Time-Based:** Uses actual times instead of abstract "hour numbers"
7. **Scalability:** Easy to generate sessions months in advance
8. **Audit Trail:** Clear tracking of who assigned what and when

## Future Enhancements

Potential additions:
- Bulk athlete assignment (import from CSV)
- Email notifications when sessions are cancelled
- Recurring training templates (copy from existing)
- Calendar view for admins
- Athlete substitution system
- Waitlist for full groups
- Training statistics and reports per recurring training
- Mobile app integration

## Troubleshooting

**No sessions showing for athletes:**
- Check if athlete is assigned to a recurring training
- Check if sessions have been generated
- Check if recurring training is active

**Athlete can't see session:**
- Verify athlete assignment in admin panel
- Check if session is not cancelled by admin
- Ensure session date is in the future

**Trainer can't mark attendance:**
- Session might be cancelled by admin
- Check if trainer is assigned to that recurring training
- Verify session exists (was generated)

## Technical Notes

- All dates are stored in UTC in database
- Times are stored as strings (HH:MM format)
- Prisma cascade deletes handle cleanup when recurring training is deleted
- Sessions can exist without recurring training (for one-off sessions)
- Attendance records are preserved even if session is cancelled
