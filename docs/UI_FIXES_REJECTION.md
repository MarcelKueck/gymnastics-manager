# UI Fixes and Athlete Rejection Feature

## Issues Fixed

### 1. ✅ Duplicate Sidebar Issue
**Problem**: The sidebar was appearing twice on pages like `/trainer/athletes/pending` because the page had its own layout wrapper with `TrainerLayout`, while the parent `/trainer/layout.tsx` already provided it.

**Solution**: Removed the duplicate `TrainerLayout` wrapper from:
- `/src/app/trainer/athletes/pending/layout.tsx`

The layout now just passes through the children without wrapping them again.

### 2. ✅ Added Athlete Rejection/Deletion Feature

**New API Endpoint**:
- `POST /api/trainer/athletes/reject` - Allows trainers and admins to reject pending athlete registrations

**Features**:
- Trainers and admins can now reject/delete pending athlete registrations
- Confirmation dialog before rejection
- Cannot reject already approved athletes
- Athlete record is completely deleted from the database
- List automatically refreshes after rejection

**UI Changes on `/trainer/athletes/pending`**:
- Added red "Ablehnen" (Reject) button next to the green "Genehmigen & Konfigurieren" button
- Both buttons are disabled while processing to prevent double-clicks
- Buttons have distinct colors:
  - Green for Approve
  - Red for Reject

## Updated Workflow

### For Trainers/Admins reviewing pending athletes:

1. Navigate to `/trainer/athletes/pending`
2. View pending athlete registration details
3. Choose one of two actions:
   - **Genehmigen & Konfigurieren** (Approve & Configure):
     - Opens modal to set training configuration
     - Approves athlete and assigns to groups
   - **Ablehnen** (Reject):
     - Shows confirmation dialog
     - Permanently deletes the registration
     - Athlete will need to re-register if needed

## Security

- Both TRAINER and ADMIN roles can reject athlete registrations
- Cannot reject already approved athletes (protection against accidental deletion)
- Requires confirmation before deletion
- API validates user permissions before processing

## Future Enhancements

- Email notification to rejected athletes with reason
- Option to provide rejection reason in UI
- Soft delete with ability to restore (instead of permanent deletion)
- Audit log for rejected registrations
