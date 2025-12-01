# Implementation Guide

## Overview

This guide provides a phase-by-phase approach to building the Gymnastics Manager application. **Follow phases sequentially** - each phase builds on the previous one.

## Implementation Phases

| Phase | Focus             | Estimated Effort      | Dependencies |
| ----- | ----------------- | --------------------- | ------------ |
| 1     | Foundation        | Core setup            | None         |
| 2     | Authentication    | User auth & roles     | Phase 1      |
| 3     | Core Data         | Training structure    | Phase 2      |
| 4     | Athlete Features  | Athlete dashboard     | Phase 3      |
| 5     | Trainer Features  | Trainer dashboard     | Phase 3      |
| 6     | Admin Features    | System management     | Phase 5      |
| 7     | Advanced Features | Notifications, files  | Phase 6      |
| 8     | Polish            | Testing, optimization | Phase 7      |

---

## Phase 1: Foundation

**Goal**: Project setup with database and base UI components

### Tasks

#### 1.1 Project Initialization
```bash
npx create-next-app@14 gymnastics-manager --typescript --tailwind --app --src-dir
cd gymnastics-manager
```

#### 1.2 Install Dependencies
```bash
# Core
npm install @prisma/client next-auth bcryptjs date-fns zod

# UI
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select
npm install @radix-ui/react-tabs @radix-ui/react-toast @radix-ui/react-checkbox
npm install class-variance-authority clsx tailwind-merge lucide-react

# Development
npm install -D prisma @types/bcryptjs
```

#### 1.3 Configure TypeScript
Update `tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

#### 1.4 Setup Prisma
```bash
npx prisma init
```

Create schema per [02-DATA-MODELS.md](./02-DATA-MODELS.md)

```bash
npx prisma generate
npx prisma db push
```

#### 1.5 Create Prisma Client Singleton
```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

#### 1.6 Setup shadcn/ui Base Components
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card dialog input label select tabs toast
```

#### 1.7 Create Utility Functions
```typescript
// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, formatStr = 'dd.MM.yyyy') {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr, { locale: de });
}

export function formatTime(time: string) {
  return time; // Already HH:MM format
}

export function formatDateTime(date: Date | string) {
  return formatDate(date, 'dd.MM.yyyy HH:mm');
}
```

### Phase 1 Checklist
- [ ] Next.js 14 project created with App Router
- [ ] All dependencies installed
- [ ] Prisma schema created and database connected
- [ ] Base UI components available
- [ ] Utility functions created
- [ ] Project runs without errors (`npm run dev`)

---

## Phase 2: Authentication

**Goal**: Complete authentication system with role-based access

### Reference
See [03-AUTHENTICATION.md](./03-AUTHENTICATION.md) for detailed requirements

### Tasks

#### 2.1 NextAuth Configuration
```typescript
// src/lib/auth.ts
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Implementation in 03-AUTHENTICATION.md
      },
    }),
  ],
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Implementation in 03-AUTHENTICATION.md
    },
    async session({ session, token }) {
      // Implementation in 03-AUTHENTICATION.md
    },
  },
  pages: {
    signIn: '/login',
  },
};
```

#### 2.2 Create Auth API Routes
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/app/api/auth/switch-role/route.ts`
- `src/app/api/register/route.ts`

#### 2.3 Create Auth Pages
- `src/app/login/page.tsx`
- `src/app/register/page.tsx`
- `src/app/unauthorized/page.tsx`

#### 2.4 Create Auth Middleware
```typescript
// src/middleware.ts
export { default } from 'next-auth/middleware';

export const config = {
  matcher: ['/athlete/:path*', '/trainer/:path*'],
};
```

#### 2.5 Create Auth Helpers
```typescript
// src/lib/api/auth.ts
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '../auth';

export async function requireAuth() { /* ... */ }
export async function requireAthlete() { /* ... */ }
export async function requireTrainer() { /* ... */ }
export async function requireAdmin() { /* ... */ }
```

#### 2.6 Create Role Switcher Component
```typescript
// src/components/shared/role-switcher.tsx
// Allows users with multiple roles to switch between them
```

### Phase 2 Checklist
- [ ] Users can register as athletes
- [ ] Users can log in with email/password
- [ ] Session contains user info and roles
- [ ] Middleware protects routes based on roles
- [ ] Role switcher works for dual-role users
- [ ] Unauthorized access redirects appropriately

---

## Phase 3: Core Data & Training Structure

**Goal**: Training management foundation

### Tasks

#### 3.1 Create Repositories
Create repository files in `src/lib/repositories/`:
- `userRepository.ts`
- `athleteRepository.ts`
- `trainerRepository.ts`
- `recurringTrainingRepository.ts`
- `trainingGroupRepository.ts`
- `trainingSessionRepository.ts`

#### 3.2 Create Services
Create service files in `src/lib/services/`:
- `athleteService.ts`
- `trainerService.ts`
- `trainingService.ts`
- `sessionGenerationService.ts`

#### 3.3 Session Generation Logic
The system must auto-generate training sessions:

```typescript
// src/lib/services/sessionGenerationService.ts
export async function generateSessions(daysAhead: number = 90) {
  // 1. Get all active recurring trainings
  // 2. For each training, calculate dates based on recurrence
  // 3. Create TrainingSession for each date (if not exists)
  // 4. Create SessionGroup for each TrainingGroup
  // 5. Copy trainer assignments to session groups
}
```

#### 3.4 Create Validation Schemas
```typescript
// src/lib/validation/training.ts
import { z } from 'zod';

export const recurringTrainingSchema = z.object({
  name: z.string().min(1, 'Name erforderlich'),
  dayOfWeek: z.enum(['MONDAY', 'TUESDAY', ...]),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  recurrence: z.enum(['ONCE', 'WEEKLY', 'BIWEEKLY', 'MONTHLY']),
});
```

#### 3.5 Create Constants
```typescript
// src/lib/constants/index.ts
export const DAY_OF_WEEK_LABELS = {
  MONDAY: 'Montag',
  TUESDAY: 'Dienstag',
  // ...
};

export const YOUTH_CATEGORY_LABELS = {
  F: 'F-Jugend',
  E: 'E-Jugend',
  D: 'D-Jugend',
};

export const ATTENDANCE_STATUS_LABELS = {
  PRESENT: 'Anwesend',
  ABSENT_EXCUSED: 'Entschuldigt abwesend',
  ABSENT_UNEXCUSED: 'Unentschuldigt abwesend',
};
```

### Phase 3 Checklist
- [ ] All repository files created with CRUD operations
- [ ] Service layer handles business logic
- [ ] Session generation creates future sessions correctly
- [ ] Validation schemas validate all inputs
- [ ] German labels available for all enums

---

## Phase 4: Athlete Features

**Goal**: Complete athlete-facing functionality

### Reference
See [04-FEATURES-ATHLETE.md](./04-FEATURES-ATHLETE.md) for detailed requirements

### Tasks

#### 4.1 Create Athlete Layout
```typescript
// src/app/athlete/layout.tsx
// Navigation, role verification, role switcher
```

#### 4.2 Athlete Dashboard
```typescript
// src/app/athlete/dashboard/page.tsx
// - Next training session
// - Upcoming sessions list
// - Monthly attendance stats
// - Active cancellations count
```

#### 4.3 Training Schedule
```typescript
// src/app/athlete/schedule/page.tsx
// - Calendar/list view of assigned trainings
// - Visual status indicators
// - Cancellation buttons
```

#### 4.4 Cancellation System
```typescript
// src/app/athlete/cancellations/page.tsx
// src/app/api/athlete/cancellations/route.ts
// - Single session cancellation
// - Bulk cancellation (date range)
// - Edit/undo before deadline
```

#### 4.5 Athlete Profile
```typescript
// src/app/athlete/profile/page.tsx
// - Edit personal info
// - View training assignments (read-only)
// - Change password
```

#### 4.6 Athlete API Routes
Create in `src/app/api/athlete/`:
- `dashboard/route.ts`
- `schedule/route.ts`
- `cancellations/route.ts`
- `cancellations/[id]/route.ts`
- `profile/route.ts`
- `history/route.ts`

### Phase 4 Checklist
- [ ] Athlete can view dashboard with stats
- [ ] Athlete can view training schedule
- [ ] Athlete can cancel individual sessions
- [ ] Athlete can bulk cancel sessions
- [ ] Athlete can edit profile information
- [ ] Athlete can view attendance history

---

## Phase 5: Trainer Features

**Goal**: Complete trainer-facing functionality

### Reference
See [05-FEATURES-TRAINER.md](./05-FEATURES-TRAINER.md) for detailed requirements

### Tasks

#### 5.1 Create Trainer Layout
```typescript
// src/app/trainer/layout.tsx
// Navigation with admin section for ADMIN role
```

#### 5.2 Trainer Dashboard
```typescript
// src/app/trainer/dashboard/page.tsx
// - Upcoming sessions this week
// - Pending approvals count
// - Athletes needing attention
// - Quick action buttons
```

#### 5.3 Session Management
```typescript
// src/app/trainer/sessions/page.tsx
// src/app/trainer/sessions/[id]/page.tsx
// - Calendar/list view
// - Session details with tabs
// - Exercise editing
// - Attendance marking
```

#### 5.4 Attendance Marking Interface
```typescript
// src/components/trainer/attendance-dialog.tsx
// - List all athletes for session
// - Pre-mark cancelled as excused
// - Status selection for each
// - Notes field
// - Bulk save
```

#### 5.5 Athlete Management
```typescript
// src/app/trainer/athletes/page.tsx
// - View all athletes
// - Filter by status, category
// - Approve pending registrations
```

#### 5.6 Trainer API Routes
Create in `src/app/api/trainer/`:
- `dashboard/route.ts`
- `athletes/route.ts`
- `athletes/[id]/route.ts`
- `athletes/[id]/approve/route.ts`
- `sessions/route.ts`
- `sessions/[id]/route.ts`
- `sessions/[id]/attendance/route.ts`
- `sessions/[id]/cancel/route.ts`

### Phase 5 Checklist
- [ ] Trainer can view dashboard with relevant stats
- [ ] Trainer can view and manage sessions
- [ ] Trainer can mark attendance for sessions
- [ ] Trainer can approve pending athletes
- [ ] Trainer can view athlete details

---

## Phase 6: Admin Features

**Goal**: System administration functionality

### Reference
See [06-FEATURES-ADMIN.md](./06-FEATURES-ADMIN.md) for detailed requirements

### Tasks

#### 6.1 Recurring Training Management
```typescript
// src/app/trainer/admin/trainings/page.tsx
// - Create/edit/delete recurring trainings
// - Manage training groups
// - Assign athletes and trainers to groups
```

#### 6.2 User Management
```typescript
// src/app/trainer/admin/users/page.tsx
// - View all users
// - Create athletes (pre-approved)
// - Create trainers
// - Edit roles and assignments
```

#### 6.3 Competition Management
```typescript
// src/app/trainer/admin/competitions/page.tsx
// - Create/edit competitions
// - Set eligibility rules
// - View registrations
// - Record results
```

#### 6.4 System Settings
```typescript
// src/app/trainer/admin/settings/page.tsx
// - Cancellation deadline hours
// - Absence alert configuration
// - File upload limits
// - Session generation settings
```

#### 6.5 Trainer Hours
```typescript
// src/app/trainer/admin/hours/page.tsx
// - Monthly hour summaries
// - Manual adjustments
// - CSV export
```

#### 6.6 Admin API Routes
Create in `src/app/api/admin/`:
- `trainings/route.ts`
- `trainings/[id]/route.ts`
- `groups/route.ts`
- `groups/[id]/route.ts`
- `groups/[id]/athletes/route.ts`
- `groups/[id]/trainers/route.ts`
- `users/route.ts`
- `trainers/route.ts`
- `competitions/route.ts`
- `settings/route.ts`
- `trainer-hours/route.ts`

### Phase 6 Checklist
- [ ] Admin can create/edit recurring trainings
- [ ] Admin can manage training groups
- [ ] Admin can assign athletes/trainers to groups
- [ ] Admin can manage users and roles
- [ ] Admin can configure system settings
- [ ] Admin can manage competitions
- [ ] Admin can view/adjust trainer hours

---

## Phase 7: Advanced Features

**Goal**: Notifications, file management, statistics

### Tasks

#### 7.1 Email Service
```typescript
// src/lib/email.ts
import { Resend } from 'resend';

export async function sendEmail(to: string, subject: string, html: string) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: 'noreply@svesting.de',
    to,
    subject,
    html,
  });
}
```

#### 7.2 Email Templates
- Registration notification (to admins)
- Approval notification (to athlete)
- Absence alert (to athlete + admin)
- Session cancellation (to affected athletes)

#### 7.3 File Management
```typescript
// src/app/api/files/upload/route.ts
// src/app/api/files/[id]/download/route.ts
// - PDF upload only
// - Category organization
// - Version tracking
```

#### 7.4 Absence Alert System
```typescript
// src/lib/services/absenceAlertService.ts
// - Check after attendance marked
// - Count unexcused in window
// - Respect cooldown period
// - Send notifications
```

#### 7.5 Statistics & Reporting
```typescript
// src/app/trainer/statistics/page.tsx
// - Attendance charts
// - Per-athlete breakdown
// - Date range filtering
```

### Phase 7 Checklist
- [ ] Email service sends notifications
- [ ] File upload/download works
- [ ] Absence alerts trigger correctly
- [ ] Statistics display accurately

---

## Phase 8: Polish & Testing

**Goal**: Production readiness

### Tasks

#### 8.1 Error Handling
- Consistent error responses
- User-friendly error messages (German)
- Error boundaries in React

#### 8.2 Loading States
- Skeleton loaders for data fetching
- Button loading states
- Page transitions

#### 8.3 Form Validation
- Client-side validation with Zod
- Server-side validation
- Inline error messages

#### 8.4 Database Seeding
```typescript
// prisma/seed.ts
// Create test data for all entities
```

#### 8.5 Manual Testing Checklist
- [ ] Registration flow works end-to-end
- [ ] Login/logout works
- [ ] Role switching works for dual-role users
- [ ] Athletes can cancel and view schedule
- [ ] Trainers can mark attendance
- [ ] Admins can configure everything
- [ ] Sessions generate correctly
- [ ] Emails send (test with real email)

### Phase 8 Checklist
- [ ] All error states handled gracefully
- [ ] Loading states provide feedback
- [ ] Forms validate and show errors
- [ ] Test data can be seeded
- [ ] All manual tests pass

---

## Development Commands

```bash
# Development
npm run dev                 # Start dev server
npx prisma studio          # Database GUI

# Database
npx prisma generate        # Generate client after schema changes
npx prisma db push         # Push schema changes (dev)
npx prisma migrate dev     # Create migration (prod-ready)
npx prisma db seed         # Run seed script

# Type checking
npm run build              # Full build with type check
npx tsc --noEmit          # Type check only
```

## Common Issues & Solutions

### Issue: Session not updating after role switch
**Solution**: Use `update` trigger in NextAuth jwt callback

### Issue: Prisma client not finding models
**Solution**: Run `npx prisma generate` after schema changes

### Issue: Middleware not protecting routes
**Solution**: Check `matcher` config in middleware.ts

### Issue: German characters displaying incorrectly
**Solution**: Ensure UTF-8 encoding in all files and database