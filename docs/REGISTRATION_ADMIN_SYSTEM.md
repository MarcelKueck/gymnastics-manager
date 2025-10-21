# Registration and Admin Approval System

## Overview
The registration system has been updated to support both athlete and trainer registrations with an admin approval workflow.

## Changes Made

### 1. Updated Registration Page (`/register`)
- **User Type Selection**: Users can now choose between "Athlete" or "Trainer" during registration
- **Required Fields for Athletes**:
  - First Name, Last Name
  - Email, Password
  - Phone Number
  - Birth Date
  - Gender (Male, Female, Other)
  - Optional: Guardian information (name, email, phone)
  - Optional: Emergency contact (name, phone)

- **Required Fields for Trainers**:
  - First Name, Last Name
  - Email, Password
  - Phone Number

### 2. Registration API (`/api/register`)
- Handles both athlete and trainer registrations
- Creates athlete accounts with `isApproved: false` (requires trainer approval)
- Creates trainer accounts with `isActive: false` (requires admin approval)
- Validates that email doesn't exist in either athlete or trainer tables

### 3. Admin Approval System

#### New API Endpoints:
- `GET /api/admin/trainers/pending` - List all pending trainer registrations (ADMIN only)
- `POST /api/admin/trainers/approve` - Approve a trainer registration (ADMIN only)
- `POST /api/admin/trainers/reject` - Reject/delete a trainer registration (ADMIN only)

#### New Admin Page:
- `/trainer/admin/pending-trainers` - Admin panel to manage pending trainer registrations
- Only visible to users with ADMIN role
- Shows pending trainers with contact information and registration date
- Allows approving (activating) or rejecting (deleting) trainer registrations

### 4. Updated Trainer Layout
- Added "Administration" section for ADMIN users
- Shows "Trainer-Freigaben" (Trainer Approvals) link only for admins
- Uses session role check to conditionally display admin navigation

### 5. Database Structure
The system already had the necessary fields:
- **Athlete table**: `isApproved` field (boolean) - set to `false` by default
- **Trainer table**: `isActive` field (boolean) - set to `false` for new registrations
- **UserRole enum**: Includes `ATHLETE`, `TRAINER`, and `ADMIN` roles

## User Workflows

### Athlete Registration Flow:
1. User selects "Athlete" on registration page
2. Fills in all required personal information
3. Account is created with `isApproved: false`
4. User cannot log in until a trainer approves the account
5. Trainer approves account via `/trainer/athletes/pending`
6. User can now log in and access athlete portal

### Trainer Registration Flow:
1. User selects "Trainer" on registration page
2. Fills in basic contact information
3. Account is created with `isActive: false`
4. User cannot log in until an admin approves the account
5. Admin approves account via `/trainer/admin/pending-trainers`
6. Trainer's `isActive` is set to `true`
7. User can now log in and access trainer portal

## Admin Account
An admin account already exists in the system (created via seed script):
- **Email**: admin@gym.com
- **Password**: admin123
- **Role**: ADMIN

This account can:
- Access all trainer features
- Access admin-only features (trainer approvals)
- Approve or reject pending trainer registrations

## Security Notes
- Only users with `ADMIN` role can approve trainers
- Only users with `TRAINER` or `ADMIN` role can approve athletes
- Middleware protects `/trainer/*` routes (requires TRAINER or ADMIN role)
- API endpoints check session role before allowing operations
- Trainer accounts with `isActive: false` cannot log in (auth.ts check)
- Athlete accounts with `isApproved: false` cannot log in (auth.ts check)

## Future Enhancements
- Email notifications when:
  - New athlete registers (notify trainers)
  - New trainer registers (notify admins)
  - Account is approved (notify user)
  - Account is rejected (notify user)
- Ability for admins to promote trainers to admin role
- Bulk approval/rejection features
- Filtering and search in pending approvals
