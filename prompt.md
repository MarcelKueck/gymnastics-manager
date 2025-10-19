🎯 Phase 7: Polish & Email Notifications - Development Prompt
Project Context
I'm building a gymnastics training management web application based on the detailed specifications in PLAN.md. The application has two portals: Athletenportal (Athlete Portal) and Trainerportal (Trainer Portal).
📊 Current Status: Phases 1-6 COMPLETE ✅
Phase 1: Foundation ✅

Next.js 14 with App Router, TypeScript, Tailwind CSS
PostgreSQL database with Prisma ORM (all 10 tables created)
NextAuth.js authentication with role-based middleware
All UI components (Button, Card, Input, Label, Textarea, Alert)
Landing page, login, registration pages

Phase 2: Athlete Portal ✅

Dashboard with quick stats
Profile page (editable contact info, READ-ONLY training config)
Training schedule with cancellation (mandatory reason, min 10 chars)
Auto-confirm toggle for future sessions
Attendance history view
Training plans download

Phase 3: Trainer Portal - Approval & Configuration ✅

Dashboard with statistics
Pending approvals with training configuration form
Athletes list with filters (group, youth category, search)
Athlete detail view with editable configuration
Group assignment management
Training plans upload and management

Phase 4-6: Session Management, Analytics & Training Plans ✅

Session list with week navigation
Session detail with GROUP-BASED attendance grid (sorted by groups 1, 2, 3)
Attendance marking (present/excused/unexcused) for past and future sessions
Equipment tracking per group
Session notes
Complete audit logging for all changes
Attendance history per athlete
Alert system for 3+ unexcused absences
PDF training plans upload/download system


🎯 What We Need Now: Phase 7 - Polish & Email Notifications
According to PLAN.md, Phase 7 includes:
1. Email Notifications System 📧 (HIGH PRIORITY)
Email Service: Resend (modern, developer-friendly)
Required Email Templates (German language):
A. Athlete Approved & Configured
Trigger: When trainer approves athlete and sets training configuration
Recipients: Athlete's email (and guardian email if provided)
Content:

Welcome message
Account approved confirmation
Training schedule details:

Training days (Mo, Do, Fr)
Hours (1. Stunde, 2. Stunde)
Group assignment
Youth category
Competition status


Login link
Contact trainer info

B. Training Schedule Changed
Trigger: When trainer updates athlete's training configuration
Recipients: Athlete's email (and guardian email if provided)
Content:

Schedule change notification
Old schedule vs New schedule comparison
Effective date
Login link to view details

C. Training Plan Uploaded
Trigger: When trainer uploads a new training plan PDF
Recipients: ALL approved athletes
Content:

New training plan available
Category (Kraftziele, Kraftübungen, Dehnziele, Dehnübungen)
Plan title
Target date (if provided)
Login link to download

D. Unexcused Absence Alert (3+)
Trigger: When athlete reaches 3 or more unexcused absences
Recipients:

Trainer (automatically)
Athlete + Guardian (optional, configurable)
Content:
Alert about attendance issue
Number of unexcused absences
List of dates with unexcused absences
Request to contact trainer
Login link to view attendance history

E. Session Reminder (OPTIONAL - Future)
Trigger: 24 hours before training session
Recipients: Athletes scheduled for that session
Content:

Reminder of upcoming training
Date, time, group
Option to cancel if needed


2. Mobile Responsiveness 📱
Requirements:

All pages must work perfectly on mobile devices (320px - 768px)
Touch-friendly buttons and interactions (min 44px touch targets)
Readable text on small screens (min 16px font size)
Optimized navigation for mobile:

Hamburger menu working smoothly
Easy access to main features
Swipe gestures where appropriate


Test on:

iOS Safari
Android Chrome
Various screen sizes (iPhone SE, iPhone 14, iPad)



Pages to Verify:

All athlete portal pages
All trainer portal pages
Especially: Session attendance grid (should work on tablet minimum)
Login, registration forms


3. UI/UX Refinements 🎨
Loading States:

Consistent loading spinners across all pages
Skeleton loaders for data-heavy pages
Button loading states (disable + spinner)
No "flash of unstyled content"

Error Handling:

User-friendly error messages (German)
Error boundaries for React components
Network error handling with retry option
Form validation errors clearly displayed
Toast notifications for success/error messages

Visual Consistency:

Consistent spacing (use Tailwind spacing scale)
Consistent button styles and sizes
Consistent card layouts
Consistent table styles
Consistent color usage (Teal for athletes, Orange for trainers)

Accessibility:

ARIA labels where needed
Keyboard navigation support
Focus indicators visible
Color contrast meets WCAG AA standards
Screen reader friendly

Nice-to-Have Animations:

Smooth page transitions
Card hover effects
Button click feedback
Modal slide-in animations
Success/error toast animations


4. Error Handling & Validation ⚠️
Client-Side Validation:

Form validation with clear error messages
Real-time validation feedback
Disable submit buttons until valid

API Error Handling:

Catch all API errors
Display user-friendly messages
Log errors to console for debugging
Retry mechanism for failed requests

Error Boundaries:

Wrap main components in error boundaries
Fallback UI for crashed components
"Something went wrong" page with refresh option


5. Performance Optimization ⚡
Code Optimization:

Code splitting where appropriate
Lazy loading for heavy components
Memoization for expensive calculations
Debouncing for search inputs

Database Optimization:

Verify indexes are in place
Optimize N+1 queries
Use pagination for large lists

Bundle Size:

Check bundle size with npm run build
Remove unused dependencies
Tree-shaking optimization


🔧 Tech Stack (Current)
Frontend: Next.js 14 (App Router), TypeScript, Tailwind CSS
Backend: Next.js API Routes
Database: PostgreSQL with Prisma ORM
Authentication: NextAuth.js
UI Components: Custom components in src/components/ui/
Icons: Lucide React
Email: Resend (to be added)
Date Handling: date-fns

📁 Current Codebase Structure
gymnastics-manager/
├── src/
│   ├── app/
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/
│   │   │   │       └── route.ts
│   │   │   ├── register/
│   │   │   │   └── route.ts
│   │   │   ├── athlete/
│   │   │   │   ├── attendance/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── cancellations/
│   │   │   │   │   ├── route.ts
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── route.ts
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── password/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── profile/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── schedule/
│   │   │   │   │   └── route.ts
│   │   │   │   └── settings/
│   │   │   │       └── route.ts
│   │   │   ├── trainer/
│   │   │   │   ├── athletes/
│   │   │   │   │   ├── route.ts
│   │   │   │   │   ├── [id]/
│   │   │   │   │   │   ├── route.ts
│   │   │   │   │   │   ├── attendance/
│   │   │   │   │   │   │   └── route.ts
│   │   │   │   │   │   └── config/
│   │   │   │   │   │       └── route.ts
│   │   │   │   │   ├── approve/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── pending/
│   │   │   │   │       └── route.ts
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── sessions/
│   │   │   │   │   ├── [date]/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── week/
│   │   │   │   │       └── route.ts
│   │   │   │   └── training-plans/
│   │   │   │       ├── route.ts
│   │   │   │       └── [id]/
│   │   │   │           └── route.ts
│   │   │   └── training-plans/
│   │   │       ├── route.ts
│   │   │       └── [id]/
│   │   │           └── download/
│   │   │               └── route.ts
│   │   ├── athlete/          # Athlete portal (COMPLETE)
│   │   │   ├── layout.tsx
│   │   │   ├── attendance/
│   │   │   │   └── page.tsx
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── profile/
│   │   │   │   └── page.tsx
│   │   │   ├── schedule/
│   │   │   │   └── page.tsx
│   │   │   └── training-plans/
│   │   │       └── page.tsx
│   │   ├── trainer/          # Trainer portal (COMPLETE)
│   │   │   ├── layout.tsx
│   │   │   ├── athletes/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── attendance/
│   │   │   │   │       └── page.tsx
│   │   │   │   └── pending/
│   │   │   │       ├── layout.tsx
│   │   │   │       └── page.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── sessions/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   └── [date]/
│   │   │   │       └── page.tsx
│   │   │   ├── statistics/
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx
│   │   │   └── training-plans/
│   │   │       ├── layout.tsx
│   │   │       └── page.tsx
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   └── unauthorized/
│   │       └── page.tsx
│   ├── components/
│   │   ├── Providers.tsx
│   │   ├── athlete/
│   │   │   └── athlete-layout.tsx
│   │   ├── trainer/
│   │   │   ├── approval-modal.tsx
│   │   │   ├── edit-config-modal.tsx
│   │   │   └── trainer-layout.tsx
│   │   └── ui/               # Reusable UI components
│   │       ├── alert.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       └── textarea.tsx
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── prisma.ts
│   │   └── utils.ts
│   ├── types/
│   │   └── next-auth.d.ts
│   └── middleware.ts
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
│       ├── migration_lock.toml
│       └── 20251018104400_init/
│           └── migration.sql
├── public/
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── uploads/                   # Training plan PDFs
│   └── training-plans/
│       └── 1760800344942-Leistungsturnen_Portal.pdf
├── docs/
│   ├── PLAN.md
│   └── SETUP.md
├── .env
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── prompt.md
├── README.md
└── tsconfig.json

🔐 Environment Variables (Current)
envDATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

# To be added in Phase 7:
RESEND_API_KEY="..."
EMAIL_FROM="noreply@yourdomain.com"

📋 Phase 7 Implementation Requirements
Part 1: Email Notification System (Priority 1)

Install Resend:

bashnpm install resend

Create Email Service:


Create src/lib/email.ts with email sending functions
Create email templates in src/emails/ directory
Use React Email for templates (optional) or plain HTML


Email Template Requirements:


All content in German
Professional, clean design
Include gym logo/branding (placeholder for now)
Mobile-responsive email design
Clear call-to-action buttons
Unsubscribe link (future)


Integration Points:


/api/trainer/athletes/approve → Send approval email
/api/trainer/athletes/[id]/config → Send schedule change email
/api/trainer/training-plans → Send new plan notification
Attendance marking logic → Check for 3+ unexcused, send alert


Configuration:


Add email sending to existing API endpoints
Create new API endpoint for sending test emails
Add email queue/retry logic (optional)


Part 2: Mobile Responsiveness (Priority 2)

Review and Fix:


Test all pages on mobile viewport (375px width)
Fix session attendance grid for tablet (768px minimum)
Ensure touch targets are 44px minimum
Test forms on mobile (proper keyboard types)
Verify navigation menu works on mobile


Specific Pages to Check:


/trainer/sessions/[date] - Attendance grid (most complex)
/trainer/athletes/pending - Approval cards
/athlete/schedule - Session cards with cancellation
All forms (login, register, configuration)


Part 3: UI/UX Polish (Priority 3)

Loading States:


Add consistent loading spinners
Add skeleton loaders for athlete/session lists
Ensure all buttons show loading state when submitting


Error Handling:


Add error boundaries to main layouts
Improve error messages (use German)
Add toast notifications for actions


Animations:


Add smooth transitions for modals
Add hover effects on interactive elements
Add success animations for completed actions


Part 4: Testing & Validation (Priority 4)

Manual Testing Checklist:


Test all email triggers
Test on mobile devices
Test all forms with invalid data
Test error scenarios (network failure, etc.)
Test with multiple athletes/sessions


Performance Check:


Run npm run build and check bundle size
Test page load times
Check database query performance


🎨 Design Guidelines
Colors:

**Primary Brand Color: #509f28 (Club Green)** - Use this for:

Primary buttons
Navigation highlights
Active states
Important UI elements
Headers and key sections


**Secondary Colors (Use Sparingly):**

Success: Green (#10b981) - for success messages only
Error: Red (#ef4444) - for errors only
Warning: Yellow (#f59e0b) - for warnings only
Neutral: Gray shades for borders and subtle elements only


**Text Colors - CRITICAL FOR READABILITY:**

**Primary Text: Always use high contrast colors**

Dark text (#1f2937 or #111827) on light backgrounds
White text (#ffffff) on dark/colored backgrounds
**NEVER use gray text on gray backgrounds**
**NEVER use light gray text unless on very dark backgrounds**


Minimum contrast ratio: WCAG AA standard (4.5:1 for normal text)
Test all text for readability before implementing
Avoid mid-tone grays (#9ca3af, #6b7280) for body text


**Keep It Clean & Professional:**

Limit color palette to: Primary green (#509f28), white, black/dark gray, and status colors
Avoid unnecessary color variations
Use white space effectively
Consistent color application across all pages


Typography:

All UI text in German
Clear, professional tone
Consistent font sizes (use Tailwind scale)
**High contrast text colors throughout** - no hard-to-read gray text
Bold/semibold for headings, regular for body text

Email Design:

Professional and clean
Club branding color (#509f28 green) as primary
Clear hierarchy
Mobile-responsive
Call-to-action buttons prominent
High contrast text (white on green, dark on white)


🚀 Your Role
You are my full-stack developer. Provide complete, production-ready code for:

Email notification system with Resend integration
Email templates (all in German)
Mobile responsiveness fixes
UI/UX improvements (loading states, error handling)
Performance optimizations

Provide:

Complete code for all files
Step-by-step implementation instructions
Testing guidelines
No placeholders or TODOs


📝 Current Test Accounts

Trainer: trainer@gym.com / trainer123
Admin: admin@gym.com / admin123
Approved Athlete: athlete@test.com / password123


✅ Success Criteria for Phase 7

 All 4 email types working and tested
 Email templates professional and mobile-responsive
 All emails in German
 All pages work perfectly on mobile (375px+)
 Session attendance grid works on tablet (768px+)
 Consistent loading states across all pages
 User-friendly error messages throughout
 No console errors in production build
 Fast page load times (<2 seconds)
 Smooth animations and transitions
 Accessible to keyboard and screen readers


🎯 Let's Start Phase 7!
Please begin by implementing the email notification system first, then move to mobile responsiveness and UI polish.
Provide complete, production-ready code with clear instructions. I'm ready to implement everything on my computer.
Let's complete Phase 7! 🚀