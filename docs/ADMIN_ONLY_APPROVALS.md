# Admin-Only Approval System

## Overview
This document describes the admin-only approval system for both athletes and trainers. All approvals are now centralized and can only be performed by administrators.

## Changes Made

### 1. Unified Approval Page
- **Location**: `/trainer/admin/approvals`
- **Access**: Admin users only
- **Features**:
  - Tabbed interface for Athletes and Trainers
  - Shows pending approvals count for each category
  - Approve/Reject functionality for both types
  - Real-time updates after approval actions

### 2. Admin-Only API Endpoints

#### Athlete Approvals
- `GET /api/admin/athletes/pending` - List pending athlete registrations
- `POST /api/admin/athletes/approve` - Approve athlete with configuration
- `POST /api/admin/athletes/reject` - Reject athlete registration

#### Trainer Approvals  
- `GET /api/admin/trainers/pending` - List pending trainer registrations
- `POST /api/admin/trainers/approve` - Approve trainer
- `POST /api/admin/trainers/reject` - Reject trainer registration

### 3. Updated Restrictions
All trainer-level endpoints now return `401 Unauthorized` for non-admin users:
- `/api/trainer/athletes/pending` - Returns error for non-admins
- `/api/trainer/athletes/approve` - Returns error for non-admins
- `/api/trainer/athletes/reject` - Returns error for non-admins

### 4. Navigation Updates
- **Menu Item**: "Freigaben" (Approvals) in Admin section
- **Old Links Updated**:
  - Dashboard: Now links to `/trainer/admin/approvals`
  - Athletes page: Now links to `/trainer/admin/approvals`
  - Removed separate "Trainer-Freigaben" menu item

### 5. Pages Affected
- `/trainer/admin/approvals/page.tsx` - NEW unified approval page
- `/trainer/dashboard/page.tsx` - Updated links
- `/trainer/athletes/page.tsx` - Updated links and API calls
- `/trainer/admin/pending-trainers/page.tsx` - Still exists but deprecated
- `/trainer/athletes/pending/page.tsx` - Still exists but deprecated

## User Flow

### For Admin Users
1. Login as admin (admin@gym.com)
2. Navigate to "Freigaben" in the Admin section
3. See tabs for "Sportler" (Athletes) and "Trainer"
4. View pending count badges on each tab
5. Review registration details
6. For Athletes: Click "Genehmigen" → Configure training settings → Save
7. For Trainers: Click "Freischalten" → Confirm
8. For rejections: Click "Ablehnen" → Confirm

### For Regular Trainers
- No longer have access to approve athletes or trainers
- Can still view approved athletes
- Cannot access approval pages (will see 401 errors)

## Security
- All approval endpoints check `session.user.role === 'ADMIN'`
- Non-admin requests receive 401 Unauthorized responses
- Audit logs still created for all approval actions
- Email notifications sent on athlete approval

## Future Considerations
- The old pages at `/trainer/athletes/pending` and `/trainer/admin/pending-trainers` should be removed
- Consider adding bulk approval functionality
- Consider adding approval history/audit trail view
- Email notifications could be added for trainer approvals

## Test Accounts
- **Admin**: admin@gym.com / admin123
- **Trainer**: trainer@gym.com / trainer123 (no approval access)
- **Athlete**: athlete@test.com / athlete123

## Related Documentation
- See `REGISTRATION_ADMIN_SYSTEM.md` for trainer registration flow
- See `DUAL_TRAINER_FEATURE.md` for recurring training system
