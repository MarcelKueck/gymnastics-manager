# Testing Guide: Dual Trainer Feature

## Prerequisites
1. Run database seed: `npx prisma db seed`
2. Start development server: `npm run dev`
3. Have test accounts ready (from seed)

## Test Cases

### Test 1: Basic Single Trainer Assignment
**Steps:**
1. Login as trainer: `trainer@gym.com` / `trainer123`
2. Navigate to "Trainingstermine" → Select any training session
3. For any group (1, 2, or 3), select "Max Müller" as Übungsleiter 1
4. Leave Übungsleiter 2 empty
5. Click "Alle Änderungen speichern"
6. Refresh the page

**Expected:**
- Success message displayed
- Max Müller remains selected as Übungsleiter 1
- Übungsleiter 2 remains empty

### Test 2: Dual Trainer Assignment
**Steps:**
1. In the same session, for a different group:
2. Select "Max Müller" as Übungsleiter 1
3. Observe that Übungsleiter 2 dropdown is now enabled
4. Select "Lisa Becker" as Übungsleiter 2
5. Click "Alle Änderungen speichern"
6. Refresh the page

**Expected:**
- Both trainers saved successfully
- Both selections persist after refresh
- Each trainer appears in correct dropdown

### Test 3: Prevent Duplicate Selection
**Steps:**
1. Select "Max Müller" as Übungsleiter 1
2. Try to find "Max Müller" in Übungsleiter 2 dropdown

**Expected:**
- Max Müller is disabled in Übungsleiter 2 dropdown
- Prevents selecting same trainer twice

### Test 4: Second Trainer Requires First
**Steps:**
1. In a new group, try to select Übungsleiter 2 without selecting Übungsleiter 1

**Expected:**
- Übungsleiter 2 dropdown is disabled
- Cannot select second trainer without first

### Test 5: Change Trainers
**Steps:**
1. Select "Max Müller" as Übungsleiter 1 and "Lisa Becker" as Übungsleiter 2
2. Save
3. Change Übungsleiter 1 to "Anna Schmidt"
4. Observe what happens to Übungsleiter 2
5. Save again

**Expected:**
- Can change first trainer freely
- Second trainer selection remains valid if different from new first trainer
- Changes persist after save

### Test 6: Remove Second Trainer
**Steps:**
1. Have both trainers assigned
2. Change Übungsleiter 2 back to "Nicht zugewiesen"
3. Keep Übungsleiter 1 selected
4. Save

**Expected:**
- Only first trainer remains assigned
- Second trainer removed successfully
- First trainer unchanged

### Test 7: All Hours and Groups
**Steps:**
1. Assign trainers to multiple groups in 1. Stunde
2. Assign different trainers to groups in 2. Stunde
3. Mix single and dual trainer assignments
4. Save everything at once

**Expected:**
- All assignments saved correctly
- No conflicts between hours or groups
- Each session maintains its own trainer assignments

### Test 8: Cross-Session Validation
**Steps:**
1. Assign "Max Müller" to Group 1, Hour 1
2. Assign "Max Müller" to Group 2, Hour 1 (same trainer, different group)
3. Assign "Max Müller" to Group 1, Hour 2 (same trainer, different hour)
4. Save

**Expected:**
- Same trainer can be assigned to multiple groups/hours
- No conflicts or errors
- All assignments saved independently

### Test 9: Admin Access
**Steps:**
1. Logout and login as admin: `admin@gym.com` / `admin123`
2. Navigate to sessions
3. Assign trainers

**Expected:**
- Admin can assign trainers
- Same functionality as regular trainer

### Test 10: Data Persistence
**Steps:**
1. Create various trainer assignments (single and dual)
2. Navigate away from the page
3. Go to different section of the app
4. Return to the same session

**Expected:**
- All trainer assignments preserved
- No data loss when navigating

## Edge Cases to Verify

### Edge Case 1: Empty Session
- Session with no athletes
- Can still assign trainers
- Trainers saved correctly

### Edge Case 2: Session with Cancellations
- Session where some athletes cancelled
- Trainer assignments work normally
- No impact on cancellations

### Edge Case 3: Past Session
- Open a past session (marked with "Vergangene Session")
- Can modify trainer assignments
- Changes saved with audit log

### Edge Case 4: Rapid Saves
- Assign trainers
- Save
- Immediately change trainers
- Save again quickly
- Both saves complete successfully

## Validation Checklist

- [ ] Can assign 1 trainer to any session
- [ ] Can assign 2 trainers to any session
- [ ] Cannot assign same trainer twice to same session
- [ ] Cannot select second trainer without first
- [ ] Can remove second trainer while keeping first
- [ ] Can change trainers and save
- [ ] Assignments persist across page refreshes
- [ ] All 6 groups (3 groups × 2 hours) work independently
- [ ] Success/error messages display correctly
- [ ] No console errors during operation
- [ ] Database stores correct trainer IDs
- [ ] Multiple sessions can be updated in one save

## Performance Check

- [ ] Page loads quickly with trainer data
- [ ] Dropdowns respond instantly
- [ ] Save operation completes within 2-3 seconds
- [ ] No lag when switching between groups

## Browser Testing (Optional)

- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

## Known Limitations

1. The feature allows 0 trainers for backwards compatibility, but ideally each session should have at least 1
2. UI only enforces 2 trainers max through client-side logic (backend also validates)
3. No visual indication in session list view showing assigned trainers (future enhancement)
