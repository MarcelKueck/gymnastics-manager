# Web Application Development Plan: Gymnastics Training Management System

## Executive Summary

This document outlines the comprehensive development plan for a dual-portal web application designed for gymnastics training management. The system consists of two main interfaces: **Athletenportal** (Athlete Portal) for gymnasts and their families, and **Übungsleiterportal** (Trainer Portal) for coaches, enabling efficient management of training sessions, attendance tracking, and communication.

---

## 1. Project Overview

### 1.1 Application Purpose
A web-based training management system for gymnastics clubs that facilitates:
- Athlete registration (self-registration or parent-managed)
- Coach-managed training configuration and group assignments
- Training session management and scheduling
- Attendance tracking and cancellation management
- Trainer oversight and group coordination
- Training plan distribution

### 1.2 Target Users
- **Athletes/Parents**: Athletes can manage their own accounts, or parents can manage accounts for younger children. View schedules and manage cancellations.
- **Trainers/Coaches (Übungsleiter)**: Manage groups, assign athletes to training schedules, track attendance, approve registrations, distribute training plans
- **Administrators**: System oversight and user management

### 1.3 Key Features
- Dual-portal architecture (Athlete + Trainer interfaces)
- Flexible account management (self or parent-managed)
- Real-time attendance and cancellation tracking with mandatory reasons
- **Auto-confirm feature**: Athletes can enable automatic confirmation for all future training sessions
- Coach-managed training assignments (days, groups, hours)
- Group-based training session organization
- PDF training plan management
- Attendance analytics and reporting with historical editing capability
- Responsive design for mobile and desktop

---

## 2. Technical Architecture

### 2.1 Recommended Technology Stack

**Frontend:**
- React 18+ with TypeScript
- React Router for navigation
- Tailwind CSS for styling
- Lucide React for icons
- React Hook Form for form management
- Zustand for state management

**Backend:**
- Next.js 14+ (App Router) with API routes
- PostgreSQL database
- Prisma ORM
- NextAuth.js for authentication
- bcrypt for password hashing

**File Storage:**
- Vercel Blob Storage or AWS S3 for PDFs

**Additional Services:**
- Resend or SendGrid for email notifications

### 2.2 Database Schema Overview

**Core Tables:**
- Athletes (unified user accounts)
- TrainingSessions (scheduled training dates)
- Groups (training group configurations)
- Cancellations (attendance cancellations with mandatory reasons)
- Attendance (check-in records - editable by coaches)
- TrainingPlans (PDF documents)
- AthleteGroupAssignments (many-to-many relationship - coach-managed)
- Trainers (coach accounts)
- AthleteSettings (auto-confirm preferences)

---

## 3. Feature Specifications

## 3.1 ATHLETENPORTAL (Athlete Portal)

### 3.1.1 User Registration & Authentication

**Registration Process:**
- Single account per athlete
- Required fields:
  - First name (Vorname)
  - Last name (Nachname)
  - Date of birth (Geburtsdatum)
  - Gender
  - Email (login username)
  - Password (with confirmation)
  - Phone number
- Optional fields (for younger athletes):
  - Guardian name
  - Guardian email
  - Guardian phone
  - Emergency contact name and number
- Email verification recommended

**Login:**
- Email and password authentication
- "Remember me" option
- Password reset functionality

**Account Management Flexibility:**
- Account can be created and managed by athlete (older kids) OR parent/guardian
- Email can be athlete's own email or parent's email
- Guardian information stored but account belongs to athlete

**Post-Registration:**
- Account created in "pending" state
- Coach must approve and assign training configuration
- Athlete notified via email once approved and configured

### 3.1.2 Profile View (Read-Only Training Configuration)

**Basic Information (Editable):**
- Name and birth date (display only after creation)
- Contact information (editable: email, phone)
- Guardian information (editable if applicable)
- Password change option

**Training Configuration (Read-Only - Coach-Assigned):**
Athletes can VIEW but NOT edit the following (only coaches can modify):
- Training day assignments:
  - Monday ✓/✗
  - Thursday ✓/✗
  - Friday ✓/✗
- Training session assignment:
  - Hour 1 (1. Stunde)
  - Hour 2 (2. Stunde)
- Group assignment:
  - Group 1, 2, or 3
- Competition participation:
  - Yes/No (Wettkampf ja/nein)
- Youth category:
  - F/E/D Jugend (automatically calculated from birth year)

**Display Note:**
- Clear indication that training configuration is managed by coaches
- "Für Änderungen kontaktieren Sie bitte Ihren Trainer" (Contact your coach for changes)

**Account Status:**
- Pending: Waiting for coach approval and configuration
- Active: Approved and configured by coach
- Status displayed prominently

### 3.1.3 Training Schedule View (Nächste Termine)

**Display:**
- Upcoming training sessions based on coach-assigned schedule
- Shows date (e.g., "Montag, 2.11.2025")
- Shows time (1. Stunde / 2. Stunde)
- Shows group number
- Grouped by date, chronologically
- Only shows future sessions

**Cancellation Feature:**
- "Absagen" (Cancel) button per session
- **MANDATORY** reason field ("Grund") - cannot submit without reason
- Minimum character requirement (e.g., 10 characters)
- Cancellations recorded with:
  - Timestamp
  - Mandatory reason
  - Athlete identifier
- Visual feedback upon successful cancellation
- Cannot cancel past sessions (button disabled)

**Auto-Confirm Feature:**
- Toggle switch: "Automatisch für alle zukünftigen Trainings zusagen"
  - (Automatically confirm all future training sessions)
- When enabled:
  - All future sessions automatically marked as "confirmed"
  - Athlete still receives session reminders
  - Can still cancel individual sessions if needed
- When disabled:
  - Default behavior (manual confirmation not required, but can cancel)
- Setting saved to athlete preferences
- Clear explanation of what this toggle does

**List View:**
- Chronological display of future sessions
- Only sessions relevant to coach-assigned schedule
- Clear indication of cancelled sessions
- Shows cancellation reason for cancelled sessions
- Shows auto-confirm status if enabled

### 3.1.4 Profile Management

**Profile Display:**
- Name and birth date
- Email and phone
- Guardian information (if applicable)
- Youth category badge (auto-calculated)
- Training schedule (read-only, coach-assigned):
  - Training days
  - Hour assignments
  - Group number
- Competition status (read-only)
- Auto-confirm preference (toggleable)
- "Kontaktdaten ändern" (Edit contact details) button

**Editable Information:**
- Contact details (email, phone)
- Guardian information
- Password change
- Auto-confirm preference

**Non-Editable Information (Coach-Managed):**
- Training days (Mo, Do, Fr)
- Hour assignments (1st/2nd)
- Group assignments
- Competition participation
- Note: "Diese Einstellungen werden von Ihrem Trainer verwaltet"

---

## 3.2 ÜBUNGSLEITERPORTAL (Trainer Portal)

### 3.2.1 Athlete Registration Approval & Configuration

**Pending Registrations View:**
- List of athletes awaiting approval
- Display format:
  - Athlete name and birth date
  - Contact information
  - Guardian information (if provided)
  - Registration date
- **No requested training configuration** (athletes don't request this)
- Approve/Reject buttons

**Approval Process:**
1. **Review athlete information**
   - Verify contact details
   - Check guardian information if provided
   - Review birth date for youth category

2. **Approve** → Opens configuration form:
   - Training days selection:
     - Monday (checkbox)
     - Thursday (checkbox)
     - Friday (checkbox)
   - Hour selection:
     - 1. Stunde (checkbox)
     - 2. Stunde (checkbox)
   - Group assignment:
     - Group 1, 2, or 3 (dropdown or radio)
   - Competition participation:
     - Yes/No (checkbox)
   - Optional notes field

3. **Save configuration**
   - Athlete account activated
   - Email notification sent to athlete/guardian
   - Training sessions automatically generated based on assignments

**Rejection Process:**
- Optional rejection reason
- Email notification sent
- Account marked as rejected (can be reactivated later)

**Important Notes:**
- Coach has full control over training assignments
- Athletes cannot request or modify their schedule
- All training configuration done by coach during or after approval

### 3.2.2 Registered Athletes Overview

**Athletes List:**
- Searchable and filterable table
- Columns:
  - Name (Last, First)
  - Birth date
  - Age/Youth category
  - Group assignments (e.g., "Gr. 1, 2")
  - Training days (Mo, Do, Fr indicators)
  - Attendance indicator
    - Green: ≥50% attendance
    - Red: <50% attendance
- Sort options: Name, Age, Attendance, Group
- Filter options: Group, Youth category, Competition status
- "Weitere Informationen" (More information) expandable sections

**Athlete Detail View:**
- Full profile information
- Contact details
- Guardian information (if available)

**Training Configuration (Coach-Editable):**
- Youth category selector (F/E/D Jugend dropdown) - overridable
- Training days (Mo, Do, Fr checkboxes)
- Hour selection (1st/2nd hour checkboxes)
- Group assignment (dropdown: 1, 2, or 3)
- Competition status (Wettkampffreigabe: Ja/Nein)
- Auto-confirm status (display only, athlete sets this)

**Additional Information:**
- "Liste Trainings" (Training list) link → Full attendance history
- Attendance summary panel:
  - Total sessions assigned
  - Sessions attended
  - Attendance percentage
  - Excused absences count
  - Excused percentage
  - Unexcused absences count
  - Recent attendance trend
- "Speichern" (Save) button to update configuration

**Changes Effect:**
- Modifying training configuration generates new future sessions
- Past attendance remains unchanged
- Notification sent to athlete about schedule changes

**Alert System:**
- Automatic warning for 3+ unexcused absences
- Visual indicator (red badge) on athlete profile
- Optional email notification to coach and athlete/guardian

### 3.2.3 Training Session Overview (Trainingsübersicht)

**Date Selection:**
- Dropdown to select specific training date
- Calendar widget for easy date picking
- Loads session data for selected date
- Can view and edit both **past and future sessions**

**Session Layout - Group-Based Grid:**

**CRITICAL: Group-Based Sorting**
- **Sessions MUST be sorted by group assignment**
- **NO age-based sorting**
- Layout structure:
  - Group 1 column
  - Group 2 column
  - Group 3 column
- Each athlete appears in their assigned group(s)
- If athlete is in multiple groups/hours, appears in each relevant section

**1. Stunde (First Hour):**

**Three Group Columns (Gruppe 1, 2, 3):**
- Each column shows athletes assigned to that group
- Athlete information per cell:
  - Athlete name
  - Birth year (in parentheses)
  - Attendance status indicator
- Athletes listed in order they were added to group (or alphabetically)
- Yellow highlighting for athletes marked as priority (configurable)

**Grund für Absage (Cancellation Reasons) Section:**
- Separate section below or beside group columns
- Lists all cancellations for that session:
  - Athlete name
  - Cancellation reason (mandatory from athlete)
  - Time of cancellation
- Greyed out or crossed-out styling
- These athletes also shown in their group columns but marked differently

**Attendance Marking (Coach-Only):**
- Click athlete name to toggle status:
  - ✓ (Green checkmark) = Present
  - ✗ (Red X) = Absent - Unexcused
  - ~ (Gray tilde) = Absent - Excused (from athlete cancellation)
- Status immediately visible
- Can mark attendance for **both past and future sessions**
- Batch operations: "Alle als anwesend markieren" (Mark all as present)

**Übungsleiter (Trainer) Assignment:**
- Section showing which trainers are assigned to this session
- Can assign/change trainers per group:
  - Gruppe 1: [Trainer dropdown]
  - Gruppe 2: [Trainer dropdown]
  - Gruppe 3: [Trainer dropdown]
- Multiple trainers can be assigned to same group

**Geräte (Equipment/Apparatus) Tracking:**
- Per-group equipment fields:
  - **Gruppe 1:**
    - Startgerät (Start apparatus): [Input field]
    - 2. Gerät (Second apparatus): [Input field]
  - **Gruppe 2:**
    - Startgerät: [Input field]
    - 2. Gerät: [Input field]
  - **Gruppe 3:**
    - Startgerät: [Input field]
    - 2. Gerät: [Input field]
- Dropdown or text input for apparatus names
- Rotation planning aid

**2. Stunde (Second Hour):**
- Identical layout to 1. Stunde
- Separate group columns
- Separate attendance tracking
- Separate equipment tracking
- Athletes may be in different groups for different hours

**Session Notes:**
- General notes field for the entire session
- Per-group notes (optional)
- Visible to all coaches

**Interactive Features:**
- Click athlete to mark attendance
- Drag-and-drop athlete between groups (optional advanced feature)
- Quick filters: Show only absent, show only excused, etc.
- Editable equipment fields with autocomplete
- "Speichern" (Save) button - saves all changes for session

**Historical Editing:**
- **Coaches can edit attendance for past sessions**
- Clear indication that session is in the past
- Audit log records who changed what and when (backend)
- Reason field for editing past attendance (optional)

**Permissions:**
- **Only coaches and admins can mark/edit attendance**
- Athletes have read-only access to their own attendance
- Changes logged for accountability

**Session History:**
- Access any past session by date
- View and modify historical attendance
- Review equipment rotations
- Check notes from previous sessions

### 3.2.4 Training Plans Management (Trainingspläne)

**Two Categories:**

**Krafttraining (Strength Training):**
- Goals document: "Ziele bis [target date]" (PDF)
- Exercises document: "Übungen" (PDF)

**Dehntraining (Stretching Training):**
- Goals document: "Ziele bis [target date]" (PDF)
- Exercises document: "Übungen" (PDF)

**Features:**
- **Download button** (visible to all users - athletes and coaches)
- **Upload button** (coach-only)
- Replace existing documents
- File validation (PDF only, max 10MB)
- Version history (optional)
- Last updated date and uploaded by (coach name)

**Upload Process:**
1. Coach clicks "Hochladen" (Upload)
2. File picker opens (PDF only)
3. Optional: Add title and target date
4. Confirm upload
5. File stored and immediately available for download
6. All athletes notified via email (optional)

### 3.2.5 Attendance Analytics & Reporting

**Per-Athlete Attendance View:**
- Accessible via "Liste Trainings" link in athlete detail
- Complete training history table:
  - Date
  - Day of week
  - Group/Hour
  - Status (✓ Present / ✗ Unexcused / ~ Excused)
  - Cancellation reason (if applicable)
  - Marked by (coach name)
  - Last modified (if edited)

**Summary Statistics:**
- Total sessions assigned: X
- Sessions attended: Y
- Attendance percentage: Z%
- Excused absences: A
- Excused percentage: B%
- Unexcused absences: C
- Current streak (consecutive attendance)

**Alert Thresholds:**
- **3+ unexcused absences**: Warning flag
- Visual indicator on athlete list
- Automatic notification to coach
- Optional notification to athlete/guardian

**Group-Level Analytics:**
- Overall group attendance rates
- Best/worst attended sessions
- Trends over time
- Cancellation reasons summary

**Export Options (Future):**
- Export to PDF/Excel
- Date range filtering
- Per-athlete or per-group reports
- Custom report builder

---

## 4. User Interface Design

### 4.1 Common Elements

**Navigation:**
- Collapsible sidebar menu
- Top header with portal name
- Profile icon/button in top-right
- Responsive mobile menu (hamburger)
- Breadcrumb navigation

**Color Scheme:**
- Primary: Teal/turquoise (#4A9B99)
- Accent: Orange (#E67E40) for headers
- Highlight: Yellow (#FFE14A) for special items
- Success: Green for positive indicators
- Warning: Red for negative indicators
- Info: Blue for informational messages
- Neutral: Grays for backgrounds

**Typography:**
- Clean sans-serif font (Inter or Open Sans)
- Clear hierarchy
- Readable font sizes (16px base minimum)

**Icons:**
- Lucide React icons
- Consistent icon usage
- Clear visual indicators

### 4.2 Athletenportal Specific UI

**Menu Items:**
- Dashboard (Übersicht)
- Nächste Termine (Upcoming sessions)
- Mein Trainingsplan (My training schedule - read-only)
- Trainingspläne (Training plans download)
- Mein Profil (My profile)
- Anwesenheit (My attendance history)

**Dashboard:**
- Welcome message with athlete name
- Quick stats:
  - Next training session
  - Attendance percentage (this month)
  - Upcoming sessions count
- Recent notifications
- Quick actions (cancel next session, etc.)

**Upcoming Sessions View:**
- Card-based layout
- Each session card:
  - Date header (prominent)
  - Day of week
  - Time (1./2. Stunde)
  - Group number
  - Status indicator (confirmed/cancelled)
  - **"Absagen" button** with reason field
  - Shows cancellation reason if already cancelled
  - Option to undo cancellation (if not too late)

**Auto-Confirm Toggle:**
- Prominent placement at top of sessions list
- Toggle switch with clear label
- Explanation tooltip/modal
- Visual feedback when enabled
- Icon indicator on sessions when auto-confirm is active

**Profile Section:**
- Two-column layout:
  - Left: Editable information
  - Right: Coach-managed information (read-only)
- Clear visual distinction between editable and read-only
- Contact info form (editable)
- Training configuration display (read-only with info icon)
- Password change section (collapsible)
- Account settings (auto-confirm preference)

### 4.3 Übungsleiterportal Specific UI

**Menu Items:**
- Dashboard (Übersicht)
- Trainingsübersicht (Session overview)
- Athleten (Athletes list)
- Anmeldungen (Pending approvals) - with badge if pending
- Trainingspläne (Training plans management)
- Statistiken (Statistics)
- Einstellungen (Settings)

**Session Overview (Trainingsübersicht):**
- Date selector at top (dropdown + calendar icon)
- Visual indicator for past/future session
- Large grid layout:
  - **Group 1 | Group 2 | Group 3** columns
  - Clear group headers
  - Athletes listed under their group
  - Color-coded attendance status
- Cancellations section (collapsible)
- Equipment tracking section (per group)
- Trainer assignments section
- Session notes (expandable text area)
- "Speichern" button (sticky at bottom on scroll)

**Interactive Attendance Marking:**
- Click athlete name → Dropdown menu:
  - ✓ Anwesend (Present)
  - ✗ Unentschuldigt fehlt (Absent - Unexcused)
  - ~ Entschuldigt (Excused)
- Or click directly for quick toggle
- Visual feedback (color change)
- Keyboard shortcuts for efficiency
- Batch operations toolbar:
  - "Alle als anwesend markieren"
  - "Auswahl als anwesend markieren"

**Athletes List:**
- Table view with sticky header
- Search bar (searches name, email)
- Filter dropdowns:
  - Group (1, 2, 3, All)
  - Youth category (F, E, D, All)
  - Competition status (Yes, No, All)
  - Attendance status (Good, Warning, All)
- Sort by column headers
- Row actions:
  - View details (eye icon)
  - Edit configuration (pencil icon)
  - View attendance (chart icon)
- Expandable row for quick info

**Approval Queue:**
- Card-based layout for pending athletes
- Each card shows:
  - Athlete name and birth date
  - Contact information
  - Guardian info if provided
  - Days since registration
- Action buttons:
  - "Genehmigen & Konfigurieren" (Approve & Configure)
  - "Ablehnen" (Reject)
- Approve opens modal with configuration form
- Reject opens reason dialog (optional)

**Athlete Configuration Modal:**
- Clear form layout
- Training days (checkboxes with day labels)
- Hours (checkboxes: 1. Stunde, 2. Stunde)
- Group (radio buttons or dropdown: 1, 2, 3)
- Competition (toggle switch: Ja/Nein)
- Preview of generated sessions
- "Speichern & Genehmigen" (Save & Approve) button

---

## 5. Simplified Data Models

### 5.1 Core Entity Schemas

```typescript
// Athlete (unified account)
interface Athlete {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  birthDate: Date;
  gender: 'male' | 'female' | 'other';
  phone: string;
  
  // Optional guardian information
  guardianName?: string;
  guardianEmail?: string;
  guardianPhone?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  
  // Coach-managed training configuration
  youthCategory: 'F' | 'E' | 'D'; // auto-calculated, coach can override
  competitionParticipation: boolean; // coach-set only
  
  // Account status
  isApproved: boolean;
  approvedBy?: string; // trainer id
  approvedAt?: Date;
  configuredAt?: Date; // when coach configured training schedule
  
  // Athlete preferences
  autoConfirmFutureSessions: boolean; // default false
  
  createdAt: Date;
  updatedAt: Date;
}

// Trainer account
interface Trainer {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'trainer' | 'admin';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Group Assignment (many-to-many) - COACH-MANAGED ONLY
interface AthleteGroupAssignment {
  id: string;
  athleteId: string;
  groupNumber: 1 | 2 | 3;
  hourNumber: 1 | 2;
  trainingDay: 'monday' | 'thursday' | 'friday';
  isActive: boolean;
  assignedBy: string; // trainer id
  assignedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Training Session
interface TrainingSession {
  id: string;
  date: Date;
  dayOfWeek: 'monday' | 'thursday' | 'friday';
  hourNumber: 1 | 2;
  groupNumber: 1 | 2 | 3;
  
  // Equipment tracking (per group)
  equipment1?: string;
  equipment2?: string;
  
  // Trainer assignments
  trainerIds: string[]; // array of trainer IDs assigned to this session
  
  // Session details
  notes?: string;
  isCompleted: boolean;
  isCancelled: boolean; // entire session cancelled (rare)
  
  createdAt: Date;
  updatedAt: Date;
}

// Cancellation - MANDATORY REASON
interface Cancellation {
  id: string;
  athleteId: string;
  trainingSessionId: string;
  reason: string; // MANDATORY, minimum 10 characters
  cancelledAt: Date;
  
  // Optional: can be undone before session
  isActive: boolean;
  undoneAt?: Date;
}

// Attendance Record - COACH/ADMIN ONLY CAN MODIFY
interface AttendanceRecord {
  id: string;
  athleteId: string;
  trainingSessionId: string;
  status: 'present' | 'absent_unexcused' | 'absent_excused';
  
  // Audit trail
  markedBy: string; // trainer id who marked/last modified
  markedAt: Date;
  lastModifiedBy?: string; // if different from markedBy
  lastModifiedAt?: Date;
  modificationReason?: string; // optional reason for editing past attendance
  
  notes?: string;
}

// Training Plan
interface TrainingPlan {
  id: string;
  category: 'strength_goals' | 'strength_exercises' | 
            'stretching_goals' | 'stretching_exercises';
  title: string;
  targetDate?: string; // "April 2026"
  filePath: string; // storage path
  fileName: string;
  fileSize: number;
  mimeType: string; // should always be 'application/pdf'
  
  // Upload info
  uploadedBy: string; // trainer id
  uploadedAt: Date;
  version: number; // increments on replace
  
  // Optional: maintain history
  replacedBy?: string; // id of newer version
  isActive: boolean;
}

// Audit Log (for attendance changes)
interface AuditLog {
  id: string;
  entityType: 'attendance' | 'athlete' | 'session';
  entityId: string;
  action: 'create' | 'update' | 'delete';
  changes: object; // JSON of what changed
  performedBy: string; // user id
  performedAt: Date;
  reason?: string;
}
```

### 5.2 Simplified Relationships

```
Athlete *---* TrainingSession (through group assignments)
Athlete 1---* Cancellation
Athlete 1---* AttendanceRecord
TrainingSession 1---* AttendanceRecord
TrainingSession 1---* Cancellation
Trainer *---* TrainingSession (assignments)
Trainer 1---* TrainingPlan (uploads)
Trainer 1---* Athlete (approvals and configurations)
Trainer 1---* AthleteGroupAssignment (creates/manages)
AttendanceRecord 1---* AuditLog (change tracking)
```

---

## 6. Updated API Endpoints

### 6.1 Authentication

```
POST   /api/auth/register          - Athlete registration
POST   /api/auth/login             - Login (athletes & trainers)
POST   /api/auth/logout            - Logout
POST   /api/auth/forgot-password   - Password reset request
POST   /api/auth/reset-password    - Password reset
GET    /api/auth/me                - Get current user
```

### 6.2 Athlete Portal APIs

```
// Profile Management
GET    /api/athlete/profile                 - Get own profile (including read-only training config)
PUT    /api/athlete/profile                 - Update editable fields only (contact info)
PUT    /api/athlete/password                - Change password
PUT    /api/athlete/settings                - Update preferences (auto-confirm)

// Training Schedule (read-only, coach-assigned)
GET    /api/athlete/schedule                - Get upcoming sessions
GET    /api/athlete/sessions                - Get all sessions (with filters)

// Cancellations (MANDATORY REASON)
POST   /api/athlete/cancellations           - Cancel session (requires reason, min 10 chars)
GET    /api/athlete/cancellations           - Get own cancellations
DELETE /api/athlete/cancellations/:id       - Undo cancellation (if before session)

// Training Plans
GET    /api/training-plans                  - Get all available plans
GET    /api/training-plans/:id/download     - Download plan

// Attendance History (read-only)
GET    /api/athlete/attendance              - Get own attendance history
```

### 6.3 Trainer Portal APIs

```
// Athletes Management
GET    /api/trainer/athletes                - Get all athletes (with filters)
GET    /api/trainer/athletes/pending        - Get pending approvals
POST   /api/trainer/athletes/:id/approve    - Approve athlete WITH training config
POST   /api/trainer/athletes/:id/reject     - Reject athlete
GET    /api/trainer/athletes/:id            - Get athlete details
PUT    /api/trainer/athletes/:id            - Update athlete (contact + training config)
PUT    /api/trainer/athletes/:id/config     - Update training configuration only
GET    /api/trainer/athletes/:id/attendance - Get attendance history

// Group Assignments (coach-only)
POST   /api/trainer/assignments             - Create group assignment
PUT    /api/trainer/assignments/:id         - Update group assignment
DELETE /api/trainer/assignments/:id         - Remove group assignment
GET    /api/trainer/assignments             - Get all assignments (with filters)

// Training Sessions
GET    /api/trainer/sessions                - Get sessions (with date filter)
GET    /api/trainer/sessions/:id            - Get session details (grouped by group)
PUT    /api/trainer/sessions/:id            - Update session (equipment, notes, trainers)
GET    /api/trainer/sessions/:date          - Get all sessions for specific date

// Attendance (COACH/ADMIN ONLY - including past sessions)
POST   /api/trainer/attendance              - Mark attendance (batch, any date)
PUT    /api/trainer/attendance/:id          - Update attendance record (including past)
POST   /api/trainer/attendance/batch        - Batch update (e.g., mark all present)
GET    /api/trainer/sessions/:id/attendance - Get all attendance for session (sorted by group)

// Training Plans
POST   /api/trainer/training-plans          - Upload plan
PUT    /api/trainer/training-plans/:id      - Replace plan
DELETE /api/trainer/training-plans/:id      - Delete plan
GET    /api/trainer/training-plans          - Get all plans (with metadata)

// Analytics
GET    /api/trainer/analytics/overview      - Overall statistics
GET    /api/trainer/analytics/groups/:id    - Group statistics
GET    /api/trainer/analytics/attendance    - Attendance trends
GET    /api/trainer/analytics/cancellations - Cancellation reasons summary

// Audit Logs (view only)
GET    /api/trainer/audit-logs              - Get audit logs (filtered)
```

### 6.4 Admin APIs

```
GET    /api/admin/users                     - Get all users
POST   /api/admin/trainers                  - Create trainer account
PUT    /api/admin/users/:id                 - Update any user
DELETE /api/admin/users/:id                 - Delete user
GET    /api/admin/stats                     - System statistics
GET    /api/admin/audit-logs                - All audit logs
```

---

## 7. Updated Page Structure

### 7.1 Athletenportal Routes

```
/                              → Landing/Login page
/login                         → Login
/register                      → Registration
/forgot-password               → Password reset request
/reset-password                → Password reset form

/athlete/dashboard             → Dashboard overview
/athlete/schedule              → Upcoming training sessions (with cancel + auto-confirm)
/athlete/training-config       → View training configuration (read-only, coach-managed)
/athlete/training-plans        → Training plans download
/athlete/profile               → Profile & settings (editable contact info)
/athlete/attendance            → Personal attendance history
```

### 7.2 Übungsleiterportal Routes

```
/trainer/dashboard             → Trainer dashboard
/trainer/athletes              → Athletes list (active)
/trainer/athletes/pending      → Pending approvals (with configuration)
/trainer/athletes/:id          → Athlete detail & configuration
/trainer/sessions              → Sessions calendar/list
/trainer/sessions/:date        → Specific session view (group-sorted, editable attendance)
/trainer/training-plans        → Training plans management
/trainer/statistics            → Analytics dashboard
/trainer/settings              → Trainer settings
```

### 7.3 Shared Routes

```
/unauthorized                  → Access denied
/404                          → Not found
```

---

## 8. Revised Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
**Core Setup:**
- Next.js project initialization
- Database schema with Prisma (including audit logs)
- NextAuth.js authentication with role-based access
- Basic UI components (Tailwind)
- Layout structure for both portals

**Deliverables:**
- Working dev environment
- Authentication system
- Database with migrations
- Basic navigation

### Phase 2: Athlete Portal (Weeks 3-4)
**Features:**
- Registration flow (contact info only)
- Profile view (read-only training config section)
- Training schedule display
- **Cancellation system with mandatory reason** (min 10 chars)
- **Auto-confirm toggle** for future sessions
- Undo cancellation feature

**Deliverables:**
- Functional athlete portal
- Cancellation with reason validation
- Auto-confirm preference working
- Pending state display

### Phase 3: Trainer Portal - Approval & Configuration (Weeks 5-6)
**Features:**
- Pending approvals list
- **Approval workflow with training configuration form**
- Athlete list with group-based sorting
- Athlete detail view
- **Coach-only training configuration editing**
- Group assignment management

**Deliverables:**
- Approval with configuration working
- Athletes management
- Coach-managed training assignments
- Email notifications on approval

### Phase 4: Training Session Overview (Weeks 7-8)
**Features:**
- Session date selector (past and future)
- **Group-sorted grid layout** (no age sorting)
- Cancellations display with reasons
- **Coach-only attendance marking** (including past sessions)
- Equipment tracking per group
- Trainer assignments
- Session notes
- Save functionality with audit logging

**Deliverables:**
- Group-based session view
- Interactive attendance marking
- Past session editing capability
- Equipment and trainer management

### Phase 5: Attendance System & Analytics (Week 9)
**Features:**
- Complete attendance history per athlete
- Statistics calculations
- Alert system (3+ unexcused absences)
- **Audit logging for attendance changes**
- Group-level analytics
- Attendance export (PDF/Excel)

**Deliverables:**
- Full attendance tracking with history
- Per-athlete and group reports
- Automated alerts
- Audit trail for changes

### Phase 6: Training Plans (Week 10)
**Features:**
- PDF upload (trainers only)
- Download system (all users)
- Version management
- File validation and storage

**Deliverables:**
- Training plan CRUD
- Upload/download working
- Version tracking

### Phase 7: Polish & Email (Week 11)
**Enhancements:**
- Mobile responsiveness
- Email notifications:
  - Athlete approved
  - Schedule changed
  - Training plan uploaded
  - 3+ unexcused absences
  - Session reminders (optional)
- UI/UX refinements
- Loading states and error handling
- Performance optimization

**Deliverables:**
- Mobile-friendly interface
- Email notification system
- Polished UI

### Phase 8: Testing & Deployment (Week 12)
**Activities:**
- Comprehensive testing
- Permission testing (coach-only features)
- Audit log verification
- Bug fixes
- Documentation
- Deployment setup
- User guides

**Deliverables:**
- Tested application
- Deployed to production
- Documentation complete
- User training materials

**Total Timeline: 12 weeks (3 months)**

---

## 9. Technical Considerations

### 9.1 Security & Permissions

**Authentication:**
- NextAuth.js with credentials provider
- bcrypt password hashing (12 rounds)
- JWT session tokens with role claims
- HTTP-only cookies
- CSRF protection (built into Next.js)

**Authorization Matrix:**

| Feature                         | Athlete | Trainer | Admin |
| ------------------------------- | ------- | ------- | ----- |
| View own schedule               | ✓       | -       | -     |
| Cancel own training             | ✓       | -       | -     |
| Set auto-confirm preference     | ✓       | -       | -     |
| View own attendance             | ✓       | -       | -     |
| Download training plans         | ✓       | ✓       | ✓     |
| **Configure training schedule** | ✗       | ✓       | ✓     |
| **Assign groups/days/hours**    | ✗       | ✓       | ✓     |
| Approve athletes                | ✗       | ✓       | ✓     |
| View all athletes               | ✗       | ✓       | ✓     |
| **Mark attendance (any date)**  | ✗       | ✓       | ✓     |
| **Edit past attendance**        | ✗       | ✓       | ✓     |
| Upload training plans           | ✗       | ✓       | ✓     |
| View audit logs                 | ✗       | ✓       | ✓     |
| Manage users                    | ✗       | ✗       | ✓     |

**Permission Enforcement:**
- Middleware for route protection
- API endpoint validation
- Server-side permission checks
- Client-side UI hiding (UX, not security)

**Audit Logging:**
- Log all attendance modifications
- Log training configuration changes
- Log approval actions
- Store who, what, when, why
- Immutable audit records

**Data Protection:**
- Input validation (Zod schemas)
- SQL injection prevention (Prisma)
- XSS protection (React default + CSP)
- Rate limiting (API routes)
- HTTPS enforcement
- File upload validation (type, size, content)

**GDPR Compliance:**
- Minimal data collection
- Data export functionality
- Account deletion option
- Privacy policy
- Cookie consent
- Guardian information handling

### 9.2 Business Logic Validation

**Cancellation Validation:**
```typescript
// Cancellation must have reason
if (!reason || reason.trim().length < 10) {
  throw new Error('Cancellation reason must be at least 10 characters');
}

// Cannot cancel past sessions
if (session.date < new Date()) {
  throw new Error('Cannot cancel past training sessions');
}

// Cannot cancel more than X hours before session (optional)
const hoursBeforeSession = (session.date - new Date()) / (1000 * 60 * 60);
if (hoursBeforeSession < 2) {
  throw new Error('Must cancel at least 2 hours before session');
}
```

**Training Configuration Validation:**
```typescript
// Only trainers/admins can configure
if (user.role !== 'trainer' && user.role !== 'admin') {
  throw new Error('Only trainers can configure training schedules');
}

// Must assign at least one day
if (!trainingDays.length) {
  throw new Error('Must assign at least one training day');
}

// Must assign at least one hour
if (!hours.length) {
  throw new Error('Must assign at least one training hour');
}

// Must assign exactly one group
if (!groupNumber || groupNumber < 1 || groupNumber > 3) {
  throw new Error('Must assign exactly one group (1, 2, or 3)');
}
```

**Attendance Modification Validation:**
```typescript
// Only trainers/admins can mark attendance
if (user.role !== 'trainer' && user.role !== 'admin') {
  throw new Error('Only trainers can mark attendance');
}

// Log all modifications for audit
await createAuditLog({
  entityType: 'attendance',
  entityId: attendanceId,
  action: 'update',
  changes: { oldStatus, newStatus },
  performedBy: user.id,
  performedAt: new Date(),
  reason: modificationReason
});
```

**Group Sorting Logic:**
```typescript
// CRITICAL: Always sort by group, not age
function getSortedAthletes(athletes: Athlete[], groupNumber: number) {
  return athletes
    .filter(a => a.groupAssignments.includes(groupNumber))
    .sort((a, b) => {
      // Sort by name within group, NOT by birth year
      return a.lastName.localeCompare(b.lastName);
    });
}
```

### 9.3 Performance

**Database:**
- Indexed columns: athleteId, trainerId, date, groupNumber
- Composite indexes for common queries
- Query optimization with Prisma
- Connection pooling
- Pagination for large lists (50 items per page)

**Frontend:**
- Next.js App Router (React Server Components)
- Route prefetching
- Image optimization (not many images expected)
- Code splitting
- Lazy loading for heavy components
- Optimistic UI updates

**Caching:**
- Next.js automatic caching
- Static pages where possible (landing, login)
- Revalidation strategies (ISR)
- Client-side caching for training plans list

**File Storage:**
- PDF files stored in Vercel Blob or S3
- CDN delivery for downloads
- Signed URLs for security
- File size limits enforced

### 9.4 Scalability

**Architecture:**
- Serverless-ready (Vercel)
- Stateless design
- Horizontal scaling

**Database:**
- PostgreSQL on managed service
- Read replicas for analytics (if needed)
- Archive strategy (data older than 2 years)

**Sessions:**
- Generate sessions dynamically based on group assignments
- Batch creation on athlete approval/configuration
- Cleanup old sessions periodically

---

## 10. Deployment & Hosting

### 10.1 Recommended Stack

**Production Environment (Vercel):**
- Hosting: Vercel (seamless Next.js integration)
- Database: Vercel Postgres or Neon (serverless Postgres)
- Storage: Vercel Blob Storage
- Email: Resend (integrated with Vercel)
- Domain: Custom domain with SSL
- Monitoring: Vercel Analytics + Sentry for errors

**Environment Variables:**
```env
# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://... # for migrations

# Auth
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://yourdomain.com

# Storage
BLOB_READ_WRITE_TOKEN=...

# Email
RESEND_API_KEY=...
EMAIL_FROM=noreply@yourdomain.com

# App
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_APP_NAME="Gymnastics Training Manager"

# Features
NEXT_PUBLIC_MIN_CANCELLATION_HOURS=2
NEXT_PUBLIC_MIN_CANCELLATION_REASON_LENGTH=10
```

### 10.2 Deployment Process

```
1. Push code to GitHub repository
2. Vercel auto-detects Next.js project
3. Configure environment variables in Vercel dashboard
4. Run database migrations (via Prisma)
5. Deploy preview for testing
6. Merge to main → production deployment
7. Verify deployment and test critical paths
```

### 10.3 Database Migration Strategy

```bash
# Development
npx prisma migrate dev --name initial_schema

# Production
npx prisma migrate deploy

# Seed data (if needed)
npx prisma db seed
```

---

## 11. Testing Strategy

### 11.1 Test Coverage

**Unit Tests (Vitest):**
- Utility functions (date calculations, youth category)
- Business logic (attendance calculations, group sorting)
- Validation functions
- Permission checks

**Integration Tests:**
- API endpoints
- Database operations
- Authentication flows
- File upload/download

**E2E Tests (Playwright):**
- **Athlete flow:**
  - Register account
  - Login
  - View schedule (coach-assigned)
  - Cancel session with reason (mandatory)
  - Enable auto-confirm
  - View attendance history
  
- **Trainer flow:**
  - Login
  - Approve athlete WITH training configuration
  - Assign groups, days, hours
  - View session (group-sorted layout)
  - Mark attendance (including past sessions)
  - Upload training plan
  - View athlete attendance history
  - Edit past attendance
  
- **Permission tests:**
  - Athlete cannot access trainer routes
  - Athlete cannot modify training configuration
  - Athlete cannot mark attendance
  - Only trainers can edit past attendance

**Manual Testing:**
- Cross-browser (Chrome, Firefox, Safari, Edge)
- Mobile devices (iOS, Android)
- Tablet views
- Accessibility (WCAG 2.1 Level AA)
- Keyboard navigation

### 11.2 Test Data

**Seed Script:**
```typescript
// Create test trainers
// Create test athletes (various ages, groups)
// Create past and future sessions
// Create sample attendance records
// Create sample cancellations
// Upload sample training plans
```

---

## 12. Documentation

### 12.1 Technical Documentation
- README with setup instructions
- API documentation (auto-generated or manual)
- Database schema with ER diagram
- Architecture overview
- Environment variables guide
- Deployment guide
- Troubleshooting guide

### 12.2 User Documentation (German)

**Athlete Guide:**
- Registrierung (Registration)
- Profil verwalten (Managing profile)
- Trainingsplan ansehen (Viewing schedule - coach-assigned)
- Training absagen (Canceling with mandatory reason)
- Auto-Bestätigung aktivieren (Enabling auto-confirm)
- Anwesenheit überprüfen (Checking attendance)

**Trainer Guide:**
- Athleten genehmigen (Approving athletes)
- Trainingsplan konfigurieren (Configuring training schedule)
- Gruppen zuweisen (Assigning groups)
- Anwesenheit markieren (Marking attendance)
- Vergangene Sitzungen bearbeiten (Editing past sessions)
- Trainingspläne hochladen (Uploading training plans)
- Statistiken ansehen (Viewing statistics)

**FAQ Section:**
- Common questions for athletes
- Common questions for trainers
- Troubleshooting

### 12.3 Admin Documentation
- User management
- System configuration
- Backup and recovery
- Audit log access
- Performance monitoring

---

## 13. Future Enhancements

### Phase 2 Features (Post-MVP):

**High Priority:**
- **News/Announcements System**: "Aktuelles" section
  - Post news to all athletes or specific groups
  - Push notifications for important updates
- **Competition Management**: "Wettkämpfe"
  - Register athletes for competitions
  - Track competition results
  - Competition attendance
- **Advanced Analytics Dashboard**:
  - Trends over time
  - Group comparisons
  - Cancellation patterns
  - Custom date ranges

**Medium Priority:**
- **Mobile App**: Native iOS/Android
  - Faster access
  - Push notifications
  - Offline mode (view schedule)
- **Calendar Integration**:
  - Export to Google Calendar
  - iCal feed
  - Sync with Apple Calendar
- **In-App Messaging**:
  - Direct messaging between athletes and trainers
  - Group messaging per training group
- **Photo Gallery**:
  - Upload training session photos
  - Competition photos
  - Secure, GDPR-compliant

**Low Priority:**
- **Payment Integration**:
  - Track training fees
  - Payment status
  - Invoice generation
- **Waiting Lists**:
  - Queue for full groups
  - Automatic notification when spot available
- **QR Code Check-in**:
  - Generate QR codes per session
  - Quick attendance marking via scan
- **Video Library**:
  - Training technique videos
  - Accessible from training plans section
- **Multi-language Support**:
  - English, other languages
- **Advanced Permissions**:
  - Assistant trainers (limited permissions)
  - Parent accounts separate from athlete accounts

---

## 14. Success Metrics & KPIs

### User Engagement:
- Registration completion rate
- Weekly active athletes
- Weekly active trainers
- Feature adoption rate (auto-confirm)
- Training plan download frequency

### System Performance:
- Page load times (<2s target)
- API response times (<500ms)
- Uptime (99.9% target)
- Database query performance

### User Satisfaction:
- Cancellation completion rate (with valid reason)
- Attendance marking completion (by trainers)
- Support ticket volume
- User feedback scores
- Net Promoter Score (NPS)

### Business Metrics:
- Total athletes registered
- Total active trainers
- Sessions per week
- Average attendance rate
- Cancellation rate
- Unexcused absence rate

---

## 15. Risk Assessment & Mitigation

| Risk                                    | Impact | Probability | Mitigation                                                 |
| --------------------------------------- | ------ | ----------- | ---------------------------------------------------------- |
| Data breach                             | High   | Low         | Strong security, encryption, regular audits, audit logging |
| Unauthorized access to trainer features | High   | Medium      | Strict permission checks, role-based access, testing       |
| Athletes editing training config        | High   | Low         | UI hidden + API validation, thorough testing               |
| Server downtime                         | High   | Low         | Vercel's 99.9% SLA, monitoring, status page                |
| Past attendance tampering               | Medium | Low         | Audit logs, immutable records, accountability              |
| Missing cancellation reasons            | Medium | Medium      | Mandatory validation, min length, clear UI                 |
| GDPR violations                         | High   | Low         | Legal review, minimal data, export/delete features         |
| Slow adoption                           | Medium | Medium      | User training, intuitive UI, clear documentation           |
| File storage costs                      | Low    | Medium      | Compression, reasonable limits (10MB), archival            |

---

## 16. Key Changes Summary

### Critical Updates from Previous Plan:

1. **Training Configuration:**
   - ✅ Athletes CANNOT configure their own training schedule
   - ✅ Coaches assign all training parameters during approval
   - ✅ Profile shows training config as READ-ONLY for athletes
   - ✅ Clear UI distinction between editable and coach-managed fields

2. **Cancellation System:**
   - ✅ Mandatory reason field (minimum 10 characters)
   - ✅ Cannot submit cancellation without valid reason
   - ✅ Auto-confirm toggle added for convenience
   - ✅ Automatic confirmation of all future sessions when enabled

3. **Approval Process:**
   - ✅ Athletes register with contact info only
   - ✅ No training configuration requested during registration
   - ✅ Coach approves AND configures training schedule
   - ✅ Configuration form shown during approval process

4. **Session Layout:**
   - ✅ MUST be sorted by assigned groups (1, 2, 3)
   - ✅ NO age-based sorting
   - ✅ Athletes appear under their assigned group(s)
   - ✅ Group-based columns, not age-based

5. **Attendance Editing:**
   - ✅ Coaches can edit PAST session attendance
   - ✅ Only coaches and admins can mark/edit attendance
   - ✅ Athletes have read-only access to their attendance
   - ✅ Audit logging for all attendance modifications
   - ✅ Date selector works for both past and future sessions

6. **Permission Model:**
   - ✅ Clear role-based access control
   - ✅ Athletes: View own data, cancel own sessions
   - ✅ Coaches: Full management, including configuration
   - ✅ Admins: Full system access

---

## 17. Development Checklist

### Phase 1: Foundation ✓
- [ ] Next.js project setup
- [ ] Database schema (with audit logs)
- [ ] NextAuth.js with role-based auth
- [ ] UI component library
- [ ] Permission middleware

### Phase 2: Athlete Portal ✓
- [ ] Registration (contact info only)
- [ ] Login/logout
- [ ] Profile view (read-only training config)
- [ ] Schedule view (coach-assigned)
- [ ] **Cancellation with mandatory reason**
- [ ] **Auto-confirm toggle**

### Phase 3: Trainer Approval & Config ✓
- [ ] Pending approvals list
- [ ] **Approval with training configuration form**
- [ ] Athletes list
- [ ] Athlete detail with **coach-editable config**
- [ ] Group assignment management

### Phase 4: Session Management ✓
- [ ] Date selector (past and future)
- [ ] **Group-sorted session layout**
- [ ] Cancellations display with reasons
- [ ] **Coach-only attendance marking**
- [ ] **Past session editing**
- [ ] Equipment tracking
- [ ] Audit logging

### Phase 5: Analytics ✓
- [ ] Attendance history per athlete
- [ ] Statistics calculations
- [ ] Alert system (3+ unexcused)
- [ ] Audit trail review

### Phase 6: Training Plans ✓
- [ ] Upload (coach-only)
- [ ] Download (all users)
- [ ] Version management

### Phase 7: Polish ✓
- [ ] Mobile responsive
- [ ] Email notifications
- [ ] Error handling
- [ ] Loading states

### Phase 8: Testing & Deploy ✓
- [ ] Permission testing
- [ ] E2E tests
- [ ] Deployment
- [ ] Documentation

---

## 18. Budget Estimate

**Development: 300-400 hours**
- Planning & Design: 30 hours
- Frontend Development: 130-160 hours (additional complexity for permissions)
- Backend Development: 110-130 hours (audit logging, complex permissions)
- Testing & QA: 50-60 hours (thorough permission testing)
- Documentation: 15-20 hours

**Infrastructure (Annual):**
- Vercel Pro: $240
- Database (Neon/Vercel Postgres): $200-400
- Storage (Blob): $50-150
- Email (Resend): $200
- Domain + SSL: $20
- Monitoring (Sentry): $0-300
- **Total**: ~$710-1,310/year

---

## 19. Conclusion

This finalized development plan incorporates all critical adjustments to create a robust gymnastics training management system with proper role-based access control and coach-managed training configuration.

### Key Features:
1. **Flexible Account Model**: Single account for athlete (self or parent-managed)
2. **Coach-Controlled Training**: Only coaches configure schedules, groups, hours
3. **Mandatory Cancellation Reasons**: Cannot cancel without providing reason
4. **Auto-Confirm Convenience**: Optional automatic confirmation for all future sessions
5. **Group-Based Session Layout**: Sorted by groups, not age
6. **Historical Attendance Editing**: Coaches can edit past sessions with audit trail
7. **Strict Permissions**: Clear boundaries between athlete and coach capabilities

### Critical Success Factors:
- **Permission Enforcement**: Rigorous testing of role-based access
- **User Experience**: Clear UI showing what's editable vs read-only
- **Audit Trail**: Complete logging of all attendance modifications
- **Data Integrity**: Validation at both UI and API levels
- **Mobile Accessibility**: Responsive design for on-the-go use

### Next Steps:
1. Final stakeholder review and approval
2. Set up development environment
3. Begin Phase 1: Foundation
4. Weekly progress reviews
5. Iterative testing throughout development

**Estimated Timeline: 12 weeks (3 months)**

This comprehensive plan provides a clear roadmap with all specified requirements incorporated. The system is designed to be maintainable, scalable, and user-friendly while maintaining strict control over training configuration and attendance management.