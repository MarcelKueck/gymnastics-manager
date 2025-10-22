# Gymnastics Manager V2 - Complete Rebuild Prompt

You are tasked with rebuilding a gymnastics training management web application from scratch with clean, maintainable, and well-architected code. The existing V1 codebase is in your project knowledge base. Your goal is to create V2 with the same functionality but with superior code quality, structure, and maintainability.

## Project Overview

**Application Name:** Gymnastics Manager (SV Esting Turnen Training Portal)  
**Tech Stack:** Next.js 15.5.6, TypeScript 5, React 19, Prisma 6, PostgreSQL, NextAuth 4, TailwindCSS 4, Zod validation  
**Purpose:** Manage gymnastics training sessions, athlete attendance, trainer assignments, and file uploads

## Key Requirements

### 1. Architecture Principles
- **Clean Architecture:** Separate concerns with clear layers (API routes, business logic, data access)
- **DRY Principle:** Eliminate all code redundancy through reusable utilities and services
- **Type Safety:** Leverage TypeScript strictly throughout
- **Error Handling:** Comprehensive error handling with user-friendly messages
- **Validation:** Input validation using Zod schemas
- **Code Organization:** Group related functionality, use consistent patterns
- **Performance:** Optimize database queries, avoid N+1 problems
- **Security:** Proper authentication, authorization, input sanitization

### 2. User Roles & Permissions

**Three User Types:**
1. **ATHLETE** - Training participants
2. **TRAINER** - Training supervisors
3. **ADMIN** - Full system administrators

**Access Control:**
- Athletes: View their schedule, mark absences (with mandatory reason ≥10 chars), view attendance history, view files, manage profile
- Trainers: All athlete features + approve new athletes, view all athletes, assign athletes to groups/trainings, mark attendance, manage training sessions, upload files, view statistics
- Admins: All trainer features + manage trainers, manage recurring trainings, manage upload categories, adjust trainer hours, full system access

### 3. Core Features

#### A. Authentication & Authorization
- NextAuth-based authentication with credentials provider
- Separate athlete and trainer login flows
- Role-based middleware protection
- Session management (JWT, 30-day expiry)
- New athlete registration requires admin/trainer approval

#### B. Training Management
**Recurring Trainings (Admin-managed):**
- Define recurring training templates (e.g., "Monday - Hour 1")
- Properties: name, day of week, start time, end time, recurrence (weekly/biweekly/monthly)
- Each recurring training can have multiple named groups (e.g., "Beginners", "Advanced", "Competition")
- Automatic session generation based on templates

**Training Groups:**
- Named groups within recurring trainings
- Athlete assignments to groups (trainer/admin managed)
- Trainer assignments to groups (admin managed, can have primary/secondary)
- Support for session-specific overrides

**Training Sessions:**
- Generated from recurring templates or manually created
- Date, time, day of week
- Session-level notes and exercises per group
- Session cancellation capability
- Completion status tracking

**Session Management:**
- Trainers can see their assigned sessions
- Drag-and-drop athlete reassignment between groups (session-specific)
- Exercise/notes entry per group per session
- Copy exercises from previous week feature

#### C. Attendance Management
- **Athlete Cancellations:** Athletes can cancel attendance with mandatory reason (≥10 chars)
- **Trainer Marking:** Trainers mark attendance post-session (Present, Absent Excused, Absent Unexcused)
- **Attendance Records:** Immutable with audit trail (who marked, when, modifications)
- **Statistics:** Attendance rates, absence patterns, participation trends

#### D. File Management (formerly "Training Plans")
- Admin-managed upload categories (e.g., "Kraftziele", "Dehnübungen", "Turnfähigkeiten")
- File uploads (PDF only) by trainers
- Categorized file organization
- Title, target date (e.g., "April 2026"), version tracking
- File download/viewing for all users
- File replacement/versioning support

#### E. Trainer Hours Tracking
- Automatic calculation based on session attendance
- Monthly summaries per trainer
- Admin can manually adjust hours
- Export functionality (CSV/Excel)
- Notes for adjustments

#### F. Athlete Management
- **Registration:** Athletes self-register, pending approval
- **Profile:** Name, email, birthdate, gender, phone, guardian info (for minors), emergency contacts
- **Training Configuration:** Youth category (F/E/D), competition participation, DTB ID status
- **Preferences:** Auto-confirm future sessions
- **Group Assignments:** Trainer/admin assigns athletes to training groups
- **Approval Workflow:** Trainers/admins approve new registrations

#### G. Statistics & Dashboards
**Athlete Dashboard:**
- Next training session
- Recent attendance record
- Upcoming schedule
- Absence overview

**Trainer Dashboard:**
- Upcoming sessions
- Athletes requiring approval
- Recent attendance statistics
- Quick actions

**Admin Dashboard:**
- System-wide statistics
- User counts (athletes, trainers)
- Session overview
- Trainer hours summary
- Pending approvals

#### H. Notifications & Alerts
- Absence alerts (configurable threshold)
- Email notifications for key events
- Admin alerts for pending approvals

### 4. Database Schema

Use the Prisma schema from the knowledge base. Key models:
- `Athlete`: Core athlete information
- `Trainer`: Trainer/admin accounts
- `RecurringTraining`: Training templates
- `TrainingGroup`: Named groups within trainings
- `TrainingSession`: Individual session instances
- `SessionGroup`: Group instances within sessions
- `RecurringTrainingAthleteAssignment`: Athlete → Group assignments
- `RecurringTrainingTrainerAssignment`: Trainer → Group assignments
- `SessionAthleteAssignment`: Session-specific athlete reassignments
- `Cancellation`: Athlete absence notifications
- `AttendanceRecord`: Trainer-marked attendance
- `Upload`: File management (formerly TrainingPlan)
- `UploadCategory`: File categories
- `MonthlyTrainerSummary`: Trainer hours tracking
- `AuditLog`: Change tracking

### 5. Code Structure

```
/
├── prisma/
│   ├── schema.prisma              # Database schema
│   ├── seed.ts                    # Seed data for development
│   └── migrations/                # Database migrations
├── public/                        # Static assets
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── page.tsx               # Landing page
│   │   ├── layout.tsx             # Root layout
│   │   ├── globals.css            # Global styles
│   │   ├── login/                 # Login page
│   │   ├── register/              # Registration page
│   │   ├── unauthorized/          # Unauthorized access page
│   │   ├── athlete/               # Athlete-specific pages
│   │   │   ├── layout.tsx         # Athlete layout
│   │   │   ├── dashboard/
│   │   │   ├── schedule/
│   │   │   ├── attendance/
│   │   │   ├── statistics/
│   │   │   ├── files/
│   │   │   └── profile/
│   │   ├── trainer/               # Trainer-specific pages
│   │   │   ├── layout.tsx         # Trainer layout
│   │   │   ├── dashboard/
│   │   │   ├── athletes/
│   │   │   ├── sessions/
│   │   │   ├── statistics/
│   │   │   ├── files/
│   │   │   ├── profile/
│   │   │   └── admin/             # Admin-specific pages
│   │   │       ├── trainings/     # Recurring training management
│   │   │       ├── groups/        # Group management
│   │   │       ├── trainers/      # Trainer management
│   │   │       ├── categories/    # Upload category management
│   │   │       └── hours/         # Trainer hours management
│   │   └── api/                   # API routes
│   │       ├── auth/              # NextAuth configuration
│   │       │   └── [...nextauth]/route.ts
│   │       ├── register/          # Registration endpoint
│   │       ├── athlete/           # Athlete-specific APIs
│   │       │   ├── dashboard/
│   │       │   ├── schedule/
│   │       │   ├── cancellations/
│   │       │   ├── attendance/
│   │       │   ├── statistics/
│   │       │   ├── profile/
│   │       │   └── password/
│   │       ├── trainer/           # Trainer-specific APIs
│   │       │   ├── dashboard/
│   │       │   ├── athletes/
│   │       │   ├── sessions/
│   │       │   ├── attendance/
│   │       │   ├── statistics/
│   │       │   ├── profile/
│   │       │   └── password/
│   │       ├── admin/             # Admin-specific APIs
│   │       │   ├── dashboard/
│   │       │   ├── trainers/
│   │       │   ├── recurring-trainings/
│   │       │   ├── groups/
│   │       │   ├── sessions/
│   │       │   ├── upload-categories/
│   │       │   ├── trainer-hours/
│   │       │   └── statistics/
│   │       └── files/             # File upload/download
│   ├── components/                # React components
│   │   ├── ui/                    # Reusable UI components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── loading.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...
│   │   ├── athlete/               # Athlete-specific components
│   │   │   ├── athlete-layout.tsx
│   │   │   ├── schedule-calendar.tsx
│   │   │   ├── cancellation-form.tsx
│   │   │   └── ...
│   │   ├── trainer/               # Trainer-specific components
│   │   │   ├── trainer-layout.tsx
│   │   │   ├── athlete-approval-modal.tsx
│   │   │   ├── session-editor.tsx
│   │   │   ├── attendance-marker.tsx
│   │   │   └── ...
│   │   ├── admin/                 # Admin-specific components
│   │   │   ├── recurring-training-form.tsx
│   │   │   ├── group-manager.tsx
│   │   │   ├── trainer-hours-editor.tsx
│   │   │   └── ...
│   │   └── shared/                # Shared components
│   │       ├── error-boundary.tsx
│   │       ├── providers.tsx
│   │       └── ...
│   ├── lib/                       # Utility libraries
│   │   ├── prisma.ts              # Prisma client singleton
│   │   ├── auth.ts                # NextAuth configuration
│   │   ├── utils.ts               # General utilities
│   │   ├── email.ts               # Email sending utilities
│   │   ├── ageGroups.ts           # Age group calculations
│   │   ├── absenceAlert.ts        # Absence alert logic
│   │   ├── validation/            # Zod schemas
│   │   │   ├── auth.ts
│   │   │   ├── athlete.ts
│   │   │   ├── training.ts
│   │   │   ├── attendance.ts
│   │   │   └── ...
│   │   ├── services/              # Business logic services
│   │   │   ├── athleteService.ts
│   │   │   ├── trainerService.ts
│   │   │   ├── trainingService.ts
│   │   │   ├── attendanceService.ts
│   │   │   ├── sessionService.ts
│   │   │   ├── fileService.ts
│   │   │   └── ...
│   │   ├── repositories/          # Data access layer
│   │   │   ├── athleteRepository.ts
│   │   │   ├── trainerRepository.ts
│   │   │   ├── trainingRepository.ts
│   │   │   └── ...
│   │   └── constants/             # Application constants
│   │       ├── roles.ts
│   │       ├── statuses.ts
│   │       └── ...
│   ├── types/                     # TypeScript type definitions
│   │   ├── next-auth.d.ts
│   │   ├── api.ts
│   │   └── ...
│   └── middleware.ts              # Route protection middleware
├── uploads/                       # Uploaded files storage
│   └── training-plans/
├── .env.example                   # Environment variables template
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
└── README.md
```

### 6. Clean Code Patterns

#### A. Service Layer Pattern
Create service classes/modules for business logic:
```typescript
// Example: src/lib/services/athleteService.ts
export class AthleteService {
  async approveAthlete(athleteId: string, trainerId: string) {
    // Business logic here
  }
  
  async getAthletesByStatus(status: 'approved' | 'pending') {
    // Use repository pattern
  }
}
```

#### B. Repository Pattern
Abstract database access:
```typescript
// Example: src/lib/repositories/athleteRepository.ts
export class AthleteRepository {
  async findById(id: string) {
    return prisma.athlete.findUnique({ where: { id } });
  }
  
  async findPendingApprovals() {
    return prisma.athlete.findMany({
      where: { isApproved: false },
      orderBy: { createdAt: 'asc' }
    });
  }
}
```

#### C. Validation Schemas
Centralize validation:
```typescript
// Example: src/lib/validation/athlete.ts
export const athleteRegistrationSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  // ... other fields
});

export const cancellationSchema = z.object({
  reason: z.string().min(10, "Reason must be at least 10 characters"),
  sessionId: z.string().cuid(),
});
```

#### D. API Response Helpers
Consistent API responses:
```typescript
// Example: src/lib/api/responseHelpers.ts
export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}
```

#### E. Error Handling
Custom error classes and handlers:
```typescript
// Example: src/lib/errors/AppError.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 400,
    public isOperational: boolean = true
  ) {
    super(message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404);
  }
}
```

### 7. UI/UX Requirements

- **Design System:** Clean, modern, professional
- **Color Scheme:** Primary green (#509f28), white backgrounds, gray text
- **Responsive:** Mobile-first, works on all devices
- **Accessibility:** Proper ARIA labels, keyboard navigation
- **Loading States:** Show loading indicators during async operations
- **Error States:** Clear error messages with recovery actions
- **Success Feedback:** Toast notifications for successful actions
- **Confirmation Dialogs:** For destructive actions
- **Form Validation:** Real-time validation with clear error messages

### 8. Key Business Rules

1. **Athlete Cancellations:**
   - Mandatory reason (minimum 10 characters)
   - Can only cancel future sessions
   - Can undo cancellation before session date
   - Cancellations don't affect attendance records (trainers mark those)

2. **Attendance Marking:**
   - Only trainers/admins can mark attendance
   - Can only mark after session date
   - Three states: Present, Absent Excused, Absent Unexcused
   - Audit trail for all changes

3. **Training Assignments:**
   - Athletes can be assigned to multiple training groups
   - Trainers can be assigned to multiple groups (primary/secondary)
   - Session-specific reassignments don't affect recurring assignments
   - Athletes auto-confirm future sessions if preference enabled

4. **Trainer Hours:**
   - Calculated from session duration × trainer assignments
   - Monthly summaries
   - Admin can adjust with notes
   - Export to Excel/CSV

5. **File Uploads:**
   - PDF only
   - Maximum file size (e.g., 10MB)
   - Categorized by admin-defined categories
   - Version tracking

6. **User Approval:**
   - New athlete registrations pending approval
   - Approved by trainer or admin
   - Email notification on approval

### 9. Environment Variables

Create `.env.example`:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/gymnastics_manager"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Email (Resend)
RESEND_API_KEY="your-resend-api-key"
FROM_EMAIL="noreply@yourapp.com"

# App
NODE_ENV="development"
```

### 10. Testing Considerations

While full tests aren't required initially, structure code to be testable:
- Pure functions for business logic
- Dependency injection where appropriate
- Mockable database layer
- Isolated components

### 11. Performance Optimizations

- **Database Queries:**
  - Use appropriate indexes
  - Eager load related data with `include`
  - Paginate large datasets
  - Use `select` to limit returned fields

- **API Routes:**
  - Validate early, fail fast
  - Use caching where appropriate
  - Implement rate limiting for public endpoints

- **Frontend:**
  - Code splitting
  - Lazy loading
  - Image optimization
  - Debounce user inputs

### 12. Security Best Practices

- **Authentication:**
  - Bcrypt password hashing (10 rounds)
  - JWT tokens with expiration
  - HTTPS in production

- **Authorization:**
  - Server-side permission checks
  - Middleware protection
  - API route guards

- **Input Validation:**
  - Validate all user input
  - Sanitize file uploads
  - Prevent SQL injection (Prisma handles this)

- **XSS Prevention:**
  - React auto-escapes by default
  - Sanitize any HTML rendering
  - Content Security Policy headers

### 13. Migration from V1

While this is a rebuild, consider:
- Database schema is preserved (can migrate data)
- File structure reorganized for clarity
- API routes may have different paths (document changes)
- Authentication mechanism unchanged (users can keep passwords)

---

## Your Task

**Generate all files needed for this project from scratch.** For each file:

1. **Provide the full file path** (e.g., `src/app/api/athlete/dashboard/route.ts`)
2. **Provide the complete file contents** - no placeholders, no "// existing code", no shortcuts
3. **Include all necessary imports and dependencies**
4. **Ensure code follows clean architecture principles**
5. **Add helpful comments for complex logic**
6. **Use consistent formatting and style**

**Start with these files in order:**

### Phase 1: Foundation
1. `package.json` - Complete with all dependencies
2. `.env.example` - All environment variables
3. `tsconfig.json` - TypeScript configuration
4. `next.config.ts` - Next.js configuration
5. `tailwind.config.ts` - Tailwind configuration
6. `postcss.config.mjs` - PostCSS configuration
7. `eslint.config.mjs` - ESLint configuration
8. `prisma/schema.prisma` - Database schema (review and optimize from V1)
9. `prisma/seed.ts` - Seed data script
10. `.gitignore` - Git ignore patterns

### Phase 2: Core Infrastructure
11. `src/lib/prisma.ts` - Prisma client singleton
12. `src/lib/auth.ts` - NextAuth configuration
13. `src/middleware.ts` - Route protection middleware
14. `src/types/next-auth.d.ts` - NextAuth type extensions
15. `src/lib/utils.ts` - General utilities
16. `src/lib/constants/roles.ts` - Role constants
17. `src/lib/constants/statuses.ts` - Status constants

### Phase 3: Validation Layer
18. `src/lib/validation/auth.ts` - Auth validation schemas
19. `src/lib/validation/athlete.ts` - Athlete validation schemas
20. `src/lib/validation/training.ts` - Training validation schemas
21. `src/lib/validation/attendance.ts` - Attendance validation schemas
22. `src/lib/validation/file.ts` - File validation schemas

### Phase 4: Data Access Layer
23. `src/lib/repositories/athleteRepository.ts`
24. `src/lib/repositories/trainerRepository.ts`
25. `src/lib/repositories/trainingRepository.ts`
26. `src/lib/repositories/sessionRepository.ts`
27. `src/lib/repositories/attendanceRepository.ts`
28. `src/lib/repositories/fileRepository.ts`

### Phase 5: Business Logic Layer
29. `src/lib/services/athleteService.ts`
30. `src/lib/services/trainerService.ts`
31. `src/lib/services/trainingService.ts`
32. `src/lib/services/sessionService.ts`
33. `src/lib/services/attendanceService.ts`
34. `src/lib/services/fileService.ts`
35. `src/lib/services/statisticsService.ts`
36. `src/lib/services/trainerHoursService.ts`

### Phase 6: API Helpers
37. `src/lib/api/responseHelpers.ts`
38. `src/lib/api/errorHandlers.ts`
39. `src/lib/api/authHelpers.ts`
40. `src/lib/email.ts`
41. `src/lib/ageGroups.ts`
42. `src/lib/absenceAlert.ts`

### Phase 7: UI Components
43. `src/components/ui/button.tsx`
44. `src/components/ui/input.tsx`
45. `src/components/ui/card.tsx`
46. `src/components/ui/loading.tsx`
47. `src/components/ui/toast.tsx`
48. `src/components/ui/label.tsx`
49. `src/components/ui/textarea.tsx`
50. `src/components/ui/alert.tsx`
51. `src/components/ui/stat-card.tsx`
52. `src/components/shared/error-boundary.tsx`
53. `src/components/shared/providers.tsx`

### Phase 8: Feature Components
54. `src/components/athlete/athlete-layout.tsx`
55. `src/components/athlete/schedule-calendar.tsx`
56. `src/components/athlete/cancellation-form.tsx`
57. `src/components/trainer/trainer-layout.tsx`
58. `src/components/trainer/athlete-approval-modal.tsx`
59. `src/components/trainer/session-editor.tsx`
60. `src/components/trainer/attendance-marker.tsx`
61. `src/components/admin/recurring-training-form.tsx`
62. `src/components/admin/group-manager.tsx`
63. `src/components/admin/trainer-hours-editor.tsx`

### Phase 9: API Routes - Auth
64. `src/app/api/auth/[...nextauth]/route.ts`
65. `src/app/api/register/route.ts`

### Phase 10: API Routes - Athlete
66. `src/app/api/athlete/dashboard/route.ts`
67. `src/app/api/athlete/schedule/route.ts`
68. `src/app/api/athlete/cancellations/route.ts`
69. `src/app/api/athlete/attendance/route.ts`
70. `src/app/api/athlete/statistics/route.ts`
71. `src/app/api/athlete/profile/route.ts`
72. `src/app/api/athlete/password/route.ts`

### Phase 11: API Routes - Trainer
73. `src/app/api/trainer/dashboard/route.ts`
74. `src/app/api/trainer/athletes/route.ts`
75. `src/app/api/trainer/athletes/approve/route.ts`
76. `src/app/api/trainer/athletes/configure/route.ts`
77. `src/app/api/trainer/sessions/route.ts`
78. `src/app/api/trainer/sessions/[id]/route.ts`
79. `src/app/api/trainer/attendance/route.ts`
80. `src/app/api/trainer/statistics/route.ts`
81. `src/app/api/trainer/profile/route.ts`
82. `src/app/api/trainer/password/route.ts`

### Phase 12: API Routes - Admin
83. `src/app/api/admin/dashboard/route.ts`
84. `src/app/api/admin/trainers/route.ts`
85. `src/app/api/admin/trainers/approve/route.ts`
86. `src/app/api/admin/trainers/reject/route.ts`
87. `src/app/api/admin/recurring-trainings/route.ts`
88. `src/app/api/admin/recurring-trainings/[id]/route.ts`
89. `src/app/api/admin/sessions/route.ts`
90. `src/app/api/admin/sessions/cancel/route.ts`
91. `src/app/api/admin/upload-categories/route.ts`
92. `src/app/api/admin/upload-categories/[id]/route.ts`
93. `src/app/api/admin/trainer-hours/route.ts`
94. `src/app/api/admin/trainer-hours/export/route.ts`
95. `src/app/api/admin/statistics/route.ts`

### Phase 13: API Routes - Files
96. `src/app/api/files/route.ts`
97. `src/app/api/files/[id]/download/route.ts`
98. `src/app/api/files/upload/route.ts`

### Phase 14: Pages - Public
99. `src/app/layout.tsx`
100. `src/app/page.tsx`
101. `src/app/globals.css`
102. `src/app/login/page.tsx`
103. `src/app/register/page.tsx`
104. `src/app/unauthorized/page.tsx`

### Phase 15: Pages - Athlete
105. `src/app/athlete/layout.tsx`
106. `src/app/athlete/dashboard/page.tsx`
107. `src/app/athlete/schedule/page.tsx`
108. `src/app/athlete/attendance/page.tsx`
109. `src/app/athlete/statistics/page.tsx`
110. `src/app/athlete/files/page.tsx`
111. `src/app/athlete/profile/page.tsx`

### Phase 16: Pages - Trainer
112. `src/app/trainer/layout.tsx`
113. `src/app/trainer/dashboard/page.tsx`
114. `src/app/trainer/athletes/page.tsx`
115. `src/app/trainer/sessions/page.tsx`
116. `src/app/trainer/statistics/page.tsx`
117. `src/app/trainer/files/page.tsx`
118. `src/app/trainer/profile/page.tsx`

### Phase 17: Pages - Admin
119. `src/app/trainer/admin/trainings/page.tsx`
120. `src/app/trainer/admin/groups/page.tsx`
121. `src/app/trainer/admin/trainers/page.tsx`
122. `src/app/trainer/admin/categories/page.tsx`
123. `src/app/trainer/admin/hours/page.tsx`

### Phase 18: Documentation & Setup
124. `README.md` - Comprehensive setup and usage instructions
125. `DEPLOYMENT.md` - Deployment guide
126. `ARCHITECTURE.md` - Architecture documentation

---

## Commands to Run (provide at the end)

After all files are created, provide a complete list of commands to:
1. Install dependencies
2. Set up environment variables
3. Initialize database
4. Run migrations
5. Seed database
6. Start development server
7. Build for production
8. Run linting

---

## Output Format

For each file, use this format:

```
### File: [full/path/to/file.ext]

```[language]
[complete file contents]
```
```

---

## Additional Notes

- Ensure all code is production-ready
- No TODO comments or placeholders
- Include proper error handling in all API routes
- Use proper TypeScript types, no `any`
- Follow Next.js 15 best practices (App Router, Server Components where appropriate)
- Optimize for performance and maintainability
- Include inline documentation for complex logic
- Use consistent naming conventions
- Ensure mobile responsiveness in all UI components
- Add proper loading and error states

**Begin generating all files now. Work systematically through each phase.**
