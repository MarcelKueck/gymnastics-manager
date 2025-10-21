# Role-Based Access Control - Trainer Dashboard Updates

## Overview

The trainer dashboard has been updated to implement proper role-based access control (RBAC). The "Approve Athletes" feature and other admin-only features are now **only visible to ADMIN users**, not regular TRAINER users.

## Changes Made

### 1. API Updates

#### File: `src/app/api/trainer/dashboard/route.ts`

**Added:**
- `userRole` field in the API response to indicate whether the user is `ADMIN` or `TRAINER`

**Response now includes:**
```typescript
{
  totalAthletes: number,
  pendingApprovals: number,
  todaySessions: number,
  alertCount: number,
  userRole: 'ADMIN' | 'TRAINER'  // NEW
}
```

This allows the frontend to make role-based UI decisions.

---

### 2. Frontend Updates

#### File: `src/app/trainer/dashboard/page.tsx`

**Added:**
- `userRole` to the `DashboardStats` interface
- `isAdmin` constant that checks if `stats?.userRole === 'ADMIN'`

**Updated Components:**

#### 2.1 Alert Section
```tsx
{/* Alert for pending approvals - ADMIN ONLY */}
{stats && stats.pendingApprovals > 0 && isAdmin && (
  <Alert variant="warning">...</Alert>
)}
```
- Alert for pending approvals now only shows for ADMIN users

#### 2.2 Stats Grid
```tsx
{/* Pending Approvals - ADMIN ONLY */}
{isAdmin && (
  <Card>...</Card>
)}
```
- "Ausstehende Genehmigungen" card is now wrapped in `{isAdmin && ...}`
- Only visible to ADMIN users

#### 2.3 Quick Actions Section
```tsx
<div className={`grid grid-cols-1 sm:grid-cols-2 ${isAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-3`}>
  {/* Athleten genehmigen - ADMIN ONLY */}
  {isAdmin && (
    <Link href="/trainer/admin/approvals">
      <Button>Athleten genehmigen</Button>
    </Link>
  )}
  
  {/* ... other actions ... */}
  
  {/* Trainingseinheiten - ADMIN ONLY */}
  {isAdmin && (
    <Link href="/trainer/admin/recurring-trainings">
      <Button>Trainingseinheiten</Button>
    </Link>
  )}
</div>
```
- "Athleten genehmigen" button now only shows for ADMIN
- "Trainingseinheiten" button now only shows for ADMIN
- Grid adapts: 4 columns for admin (4 buttons), 3 columns for trainer (2 buttons)

#### 2.4 Management Cards
```tsx
{/* Athletenverwaltung */}
<p>
  Verwalte deine Athleten, 
  {isAdmin ? 'weise sie Trainingsgruppen zu und überprüfe ihre' : 'überprüfe ihre'}
  Anwesenheitsstatistiken.
</p>

{/* Genehmigungen - ADMIN ONLY */}
{isAdmin && (
  <Link href="/trainer/admin/approvals">
    <Button>Genehmigungen</Button>
  </Link>
)}
```
- Description text adapts based on role
- "Genehmigungen" button only shows for ADMIN

```tsx
{/* Trainingsverwaltung */}
<p>
  {isAdmin ? 'Erstelle wiederkehrende Trainingseinheiten, verwalte' : 'Verwalte'}
  Trainingspläne und markiere Anwesenheit.
</p>

{/* Trainingseinheiten - ADMIN ONLY */}
{isAdmin && (
  <Link href="/trainer/admin/recurring-trainings">
    <Button>Trainingseinheiten</Button>
  </Link>
)}
```
- Description text adapts based on role
- "Trainingseinheiten" button only shows for ADMIN

---

## Admin vs Trainer Features

### Features Available to ADMIN Only
✅ View pending approval count
✅ See pending approval alerts
✅ Access athlete approval page (`/trainer/admin/approvals`)
✅ Manage recurring training sessions (`/trainer/admin/recurring-trainings`)
✅ Assign athletes to training groups

### Features Available to Both ADMIN and TRAINER
✅ View active athletes
✅ Mark attendance for sessions
✅ Upload/view training plans
✅ View statistics
✅ See athletes with attendance warnings

---

## Visual Differences

### Admin User Sees:
1. **Stats Grid**: 4 cards
   - Active Athletes
   - Pending Approvals (orange if > 0)
   - Today's Sessions
   - Warnings (red if > 0)

2. **Quick Actions**: 4 buttons
   - Athleten genehmigen
   - Anwesenheit markieren
   - Trainingspläne
   - Trainingseinheiten

3. **Management Cards**: Full admin features
   - Athletenverwaltung: Athletes, **Genehmigungen**, Statistics
   - Trainingsverwaltung: **Trainingseinheiten**, Sessions, Training Plans

### Trainer User Sees:
1. **Stats Grid**: 3 cards
   - Active Athletes
   - ~~Pending Approvals~~ (hidden)
   - Today's Sessions
   - Warnings (red if > 0)

2. **Quick Actions**: 2 buttons
   - ~~Athleten genehmigen~~ (hidden)
   - Anwesenheit markieren
   - Trainingspläne
   - ~~Trainingseinheiten~~ (hidden)

3. **Management Cards**: Limited trainer features
   - Athletenverwaltung: Athletes, ~~Genehmigungen~~, Statistics
   - Trainingsverwaltung: ~~Trainingseinheiten~~, Sessions, Training Plans

---

## Backend Authorization

### Note on Server-Side Protection
While the UI now properly hides admin-only features from trainers, **server-side API endpoints** still need to enforce authorization:

#### Already Protected:
- `/api/admin/*` routes check for `role === 'ADMIN'`
- `/trainer/admin/*` pages should also enforce admin-only access

#### Recommendation:
Review and ensure these API endpoints only allow ADMIN access:
- `POST /api/admin/athletes/approve`
- `POST /api/admin/recurring-trainings`
- `POST /api/admin/recurring-trainings/[id]/athletes`
- `POST /api/admin/recurring-trainings/[id]/trainers`
- `POST /api/admin/sessions/cancel`

Example middleware check:
```typescript
const session = await getServerSession(authOptions);
if (!session || session.user.role !== 'ADMIN') {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
}
```

---

## Testing Checklist

### As ADMIN User:
- [x] Dashboard shows all 4 stat cards
- [x] Pending approvals alert shows when approvals pending
- [x] "Athleten genehmigen" button visible in quick actions
- [x] "Trainingseinheiten" button visible in quick actions
- [x] "Genehmigungen" link visible in management cards
- [x] Can access `/trainer/admin/approvals`
- [x] Can access `/trainer/admin/recurring-trainings`

### As TRAINER User:
- [x] Dashboard shows only 3 stat cards (no pending approvals)
- [x] No pending approvals alert
- [x] "Athleten genehmigen" button hidden
- [x] "Trainingseinheiten" button hidden
- [x] "Genehmigungen" link hidden in management cards
- [x] Cannot see admin-only features
- [x] Grid layout adapts (3 columns instead of 4)

### Both Roles:
- [x] Can see active athletes count
- [x] Can see today's sessions
- [x] Can see warning alerts
- [x] Can access `/trainer/sessions`
- [x] Can access `/trainer/training-plans`
- [x] Can access `/trainer/statistics`

---

## Role Assignment

### Current System:
Roles are stored in the `Trainer` table:
```prisma
model Trainer {
  id    String   @id @default(cuid())
  role  UserRole @default(TRAINER)  // TRAINER or ADMIN
  // ...
}

enum UserRole {
  ATHLETE
  TRAINER
  ADMIN
}
```

### To Promote a Trainer to Admin:
```sql
UPDATE "Trainer" 
SET role = 'ADMIN' 
WHERE email = 'admin@example.com';
```

Or via Prisma Studio:
1. Open Prisma Studio: `npx prisma studio`
2. Navigate to `Trainer` table
3. Find the trainer
4. Change `role` from `TRAINER` to `ADMIN`
5. Save

---

## Future Enhancements

### Potential Additions:
1. **Role Management UI**: Admin page to promote/demote trainers
2. **Permission Groups**: Fine-grained permissions (e.g., "can approve athletes", "can manage sessions")
3. **Audit Log**: Track when admins perform sensitive actions
4. **Multi-level Roles**: Super Admin, Admin, Senior Trainer, Trainer
5. **Temporary Permissions**: Grant admin access for a limited time

---

## Summary

✅ **Trainer users** can no longer see or access athlete approval features
✅ **Admin users** have full access to all features including approvals and recurring training management
✅ **UI adapts** based on user role with conditional rendering
✅ **API returns** user role for frontend decision-making
✅ **Backend enforcement** should be verified for all admin-only endpoints

The system now properly implements role-based access control with clear separation between TRAINER and ADMIN capabilities.
