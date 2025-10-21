# Database Seed Information

## Fresh Database Setup Complete! ✅

The database has been reset and seeded with sample data for the new recurring training system.

## Test Accounts

### Admin Account
- **Email:** admin@gym.com
- **Password:** admin123
- **Role:** ADMIN
- **Permissions:** Full access to all features including recurring training management

### Trainer Accounts
1. **Email:** trainer@gym.com
   - **Password:** trainer123
   - **Name:** Max Müller
   
2. **Email:** trainer2@gym.com
   - **Password:** trainer2
   - **Name:** Lisa Becker

### Athlete Accounts
1. **Approved Athlete**
   - **Email:** athlete@test.com
   - **Password:** athlete123
   - **Name:** Lisa Weber
   - **Status:** ✅ Approved and configured
   - **Assigned to:** 2 recurring trainings (Monday and Thursday, Group 1)

2. **Pending Athlete**
   - **Email:** pending@test.com
   - **Password:** pending123
   - **Name:** Tom Becker
   - **Status:** ⏳ Pending approval (cannot login yet)

## Seeded Recurring Trainings

### 1. Montag 17:00 - Gruppe 1
- **Day:** Monday
- **Time:** 17:00 - 18:30
- **Group:** 1
- **Trainers:** Max Müller (Primary) + Lisa Becker (Secondary)
- **Athletes:** Lisa Weber

### 2. Montag 18:30 - Gruppe 2
- **Day:** Monday
- **Time:** 18:30 - 20:00
- **Group:** 2
- **Trainers:** Max Müller (Primary)
- **Athletes:** None yet

### 3. Donnerstag 17:00 - Gruppe 1
- **Day:** Thursday
- **Time:** 17:00 - 18:30
- **Group:** 1
- **Trainers:** Lisa Becker (Primary)
- **Athletes:** Lisa Weber

### 4. Freitag 16:00 - Gruppe 3
- **Day:** Friday
- **Time:** 16:00 - 17:30
- **Group:** 3
- **Trainers:** Max Müller (Primary)
- **Athletes:** None yet

## Generated Training Sessions

- **Total Sessions:** 32 sessions
- **Time Period:** Next 8 weeks
- **Distribution:** 8 sessions per recurring training
- **Status:** All sessions ready for attendance marking

## What You Can Test

### As Admin (admin@gym.com)
1. ✅ View and manage all recurring trainings
2. ✅ Create new recurring trainings
3. ✅ Assign/remove athletes to training groups
4. ✅ Assign/remove trainers (up to 2 per training)
5. ✅ Generate more sessions (up to 12 weeks ahead)
6. ✅ Cancel sessions with reasons
7. ✅ Approve pending athletes (Tom Becker is waiting!)
8. ✅ Approve pending trainers

### As Trainer (trainer@gym.com or trainer2@gym.com)
1. ✅ View assigned training sessions
2. ✅ Mark attendance for athletes
3. ✅ See athlete cancellations
4. ✅ View athlete profiles and history
5. ✅ Assign athletes to recurring trainings (trainer permission)
6. ✅ Upload training plans

### As Athlete (athlete@test.com)
1. ✅ View upcoming training schedule (2 trainings per week)
2. ✅ Cancel sessions with reason
3. ✅ Undo cancellations before session
4. ✅ View training plans
5. ✅ Update profile settings
6. ✅ Toggle auto-confirmation

## Quick Testing Guide

### Test the Full Workflow

1. **Login as Admin**
   ```
   Email: admin@gym.com
   Password: admin123
   ```

2. **Approve Pending Athlete**
   - Go to "Athleten" → "Ausstehende Freigaben"
   - Approve Tom Becker
   - Configure his training settings

3. **Assign Tom to a Training**
   - Go to "Wiederkehrende Trainings"
   - Click "Bearbeiten" on "Montag 18:30 - Gruppe 2"
   - Add Tom Becker to this training

4. **Generate More Sessions**
   - Go back to "Wiederkehrende Trainings"
   - Click "Sessions" on any training
   - Confirm to generate 12 more weeks

5. **Login as Trainer**
   ```
   Email: trainer@gym.com
   Password: trainer123
   ```

6. **Mark Attendance**
   - Go to "Trainingstermine"
   - Select the current week's Monday
   - Mark attendance for Lisa Weber in Gruppe 1

7. **Login as Athlete**
   ```
   Email: athlete@test.com
   Password: athlete123
   ```

8. **Cancel a Session**
   - Go to "Nächste Termine"
   - Click "Training absagen" on any upcoming session
   - Provide a reason (min 10 characters)
   - Observe it's marked as cancelled

9. **Login as Admin Again**
   - Go to "Wiederkehrende Trainings"
   - Try cancelling all future sessions for a training
   - See how it affects trainer and athlete views

## Database Statistics

- **Trainers:** 3 (2 regular + 1 admin)
- **Athletes:** 2 (1 approved + 1 pending)
- **Recurring Trainings:** 4 templates
- **Generated Sessions:** 32 sessions
- **Athlete Assignments:** 2 assignments
- **Trainer Assignments:** 5 assignments
- **Sessions with Multiple Trainers:** 8 sessions (Montag Gruppe 1)

## Notes

- All passwords are simple for testing purposes (e.g., "admin123")
- Sessions are generated for the next 8 weeks starting from today
- The approved athlete (Lisa) can immediately login and see her schedule
- The pending athlete (Tom) cannot login until approved by admin or trainer
- All recurring trainings have weekly recurrence by default
- You can generate more sessions anytime via the admin interface

## Resetting Again

To reset and reseed the database again:

```bash
npx prisma migrate reset --force
```

This will:
1. Drop all tables
2. Re-run all migrations
3. Run the seed script automatically
