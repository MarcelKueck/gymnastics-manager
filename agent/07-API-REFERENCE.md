# API Reference

## Overview

All API routes follow RESTful conventions and are organized by role/domain. This document provides a complete reference of all endpoints.

## Base URL

```
/api
```

## Response Format

### Success Response

```json
{
  "data": { ... },
  "message": "Optional success message"
}
```

### Error Response

```json
{
  "error": "Error message",
  "details": { ... }
}
```

### HTTP Status Codes

| Code | Meaning                              |
| ---- | ------------------------------------ |
| 200  | Success                              |
| 201  | Created                              |
| 400  | Bad Request (validation error)       |
| 401  | Unauthorized (not logged in)         |
| 403  | Forbidden (insufficient permissions) |
| 404  | Not Found                            |
| 500  | Server Error                         |

---

## Authentication Endpoints

### POST /api/auth/[...nextauth]

NextAuth.js handler for authentication.

### POST /api/auth/switch-role

Switch active role for dual-role users.

**Request:**
```json
{
  "role": "ATHLETE" | "TRAINER" | "ADMIN"
}
```

**Response:**
```json
{
  "success": true,
  "activeRole": "TRAINER",
  "message": "Rolle erfolgreich gewechselt"
}
```

### POST /api/register

Register new athlete account.

**Request:**
```json
{
  "email": "string",
  "password": "string (min 8)",
  "confirmPassword": "string",
  "firstName": "string",
  "lastName": "string",
  "phone": "string",
  "birthDate": "string (optional)",
  "gender": "MALE" | "FEMALE" | "OTHER" (optional),
  "guardianName": "string (optional)",
  "guardianEmail": "string (optional)",
  "guardianPhone": "string (optional)",
  "emergencyContactName": "string (optional)",
  "emergencyContactPhone": "string (optional)"
}
```

---

## Athlete Endpoints

All require `ATHLETE` active role.

### GET /api/athlete/dashboard

Get athlete dashboard data.

**Response:**
```json
{
  "data": {
    "upcomingSessions": [
      {
        "id": "string",
        "date": "datetime",
        "name": "string",
        "startTime": "HH:MM",
        "endTime": "HH:MM",
        "isCancelled": "boolean"
      }
    ],
    "monthlyStats": {
      "totalSessions": "number",
      "presentCount": "number",
      "attendanceRate": "number (0-100)"
    },
    "activeCancellations": "number"
  }
}
```

### GET /api/athlete/schedule

Get athlete's training schedule.

**Query Parameters:**
| Param | Type   | Default | Description          |
| ----- | ------ | ------- | -------------------- |
| weeks | number | 4       | Weeks ahead to fetch |

**Response:**
```json
{
  "data": [
    {
      "id": "string",
      "date": "datetime",
      "name": "string",
      "startTime": "HH:MM",
      "endTime": "HH:MM",
      "isCancelled": "boolean",
      "athleteCancelled": "boolean",
      "athleteCancellationReason": "string?",
      "isCompleted": "boolean",
      "attendanceStatus": "PRESENT" | "ABSENT_EXCUSED" | "ABSENT_UNEXCUSED" | null
    }
  ]
}
```

### GET /api/athlete/cancellations

Get athlete's active cancellations.

### POST /api/athlete/cancellations

Create new cancellation.

**Request:**
```json
{
  "trainingSessionId": "string",
  "reason": "string (min 10 chars)"
}
```

### PUT /api/athlete/cancellations/[id]

Update cancellation reason.

**Request:**
```json
{
  "reason": "string (min 10 chars)"
}
```

### DELETE /api/athlete/cancellations/[id]

Undo (deactivate) cancellation.

### POST /api/athlete/cancellations/bulk

Bulk cancel sessions in date range.

**Request:**
```json
{
  "startDate": "date string",
  "endDate": "date string",
  "reason": "string (min 10 chars)",
  "recurringTrainingIds": ["string"] (optional)
}
```

### GET /api/athlete/profile

Get athlete profile.

### PUT /api/athlete/profile

Update athlete profile.

**Request:**
```json
{
  "firstName": "string",
  "lastName": "string",
  "phone": "string",
  "guardianName": "string?",
  "guardianEmail": "string?",
  "guardianPhone": "string?",
  "emergencyContactName": "string?",
  "emergencyContactPhone": "string?"
}
```

### GET /api/athlete/history

Get attendance history.

**Query Parameters:**
| Param | Type | Description       |
| ----- | ---- | ----------------- |
| from  | date | Start date filter |
| to    | date | End date filter   |

### GET /api/athlete/competitions

Get available competitions.

### POST /api/athlete/competitions/[id]/register

Register for competition.

### DELETE /api/athlete/competitions/[id]/register

Unregister from competition.

### GET /api/athlete/files

Get available files/documents.

### GET /api/athlete/settings

Get system settings (read-only, for deadline info).

---

## Trainer Endpoints

All require `TRAINER` or `ADMIN` active role.

### GET /api/trainer/dashboard

Get trainer dashboard data.

**Response:**
```json
{
  "data": {
    "upcomingSessions": [...],
    "pendingApprovals": "number",
    "athletesNeedingAttention": [...],
    "stats": {
      "sessionsThisWeek": "number",
      "attendanceMarkedThisWeek": "number"
    }
  }
}
```

### GET /api/trainer/athletes

List athletes.

**Query Parameters:**
| Param    | Type   | Description                  |
| -------- | ------ | ---------------------------- |
| status   | string | "approved", "pending", "all" |
| category | string | Youth category filter        |
| search   | string | Name/email search            |

### GET /api/trainer/athletes/[id]

Get athlete details.

### PUT /api/trainer/athletes/[id]

Update athlete (configuration).

### POST /api/trainer/athletes/[id]/approve

Approve pending athlete.

**Request:**
```json
{
  "youthCategory": "F" | "E" | "D",
  "competitionParticipation": "boolean",
  "hasDtbId": "boolean",
  "trainingGroupIds": ["string"]
}
```

### GET /api/trainer/sessions

List training sessions.

**Query Parameters:**
| Param | Type | Description             |
| ----- | ---- | ----------------------- |
| date  | date | Filter by specific date |
| from  | date | Start date filter       |
| to    | date | End date filter         |

### GET /api/trainer/sessions/[id]

Get session details with groups, athletes, attendance.

### PUT /api/trainer/sessions/[id]

Update session (notes, time overrides).

### POST /api/trainer/sessions/[id]/attendance

Mark attendance for session.

**Request:**
```json
{
  "records": [
    {
      "athleteId": "string",
      "status": "PRESENT" | "ABSENT_EXCUSED" | "ABSENT_UNEXCUSED",
      "notes": "string?"
    }
  ]
}
```

### POST /api/trainer/sessions/[id]/cancel

Cancel training session.

**Request:**
```json
{
  "reason": "string (min 10 chars)"
}
```

### POST /api/trainer/sessions/[id]/complete

Mark session as completed.

### PUT /api/trainer/sessions/[id]/exercises

Update exercises for session group.

**Request:**
```json
{
  "sessionGroupId": "string",
  "exercises": "string"
}
```

### GET /api/trainer/sessions/upcoming

Get upcoming sessions for trainer.

### GET /api/trainer/statistics/attendance

Get attendance statistics.

**Query Parameters:**
| Param | Type | Description |
| ----- | ---- | ----------- |
| from  | date | Start date  |
| to    | date | End date    |

### GET /api/trainer/files

List all files.

### POST /api/trainer/files/upload

Upload new file.

**Request:** `multipart/form-data`
| Field      | Type       | Required |
| ---------- | ---------- | -------- |
| file       | File (PDF) | Yes      |
| title      | string     | Yes      |
| categoryId | string     | Yes      |
| targetDate | string     | No       |

### PUT /api/trainer/files/[id]

Update file metadata.

### DELETE /api/trainer/files/[id]

Delete file.

### GET /api/trainer/profile

Get trainer profile.

### PUT /api/trainer/profile

Update trainer profile.

---

## Admin Endpoints

All require `ADMIN` active role.

### Recurring Trainings

#### GET /api/admin/trainings

List all recurring trainings.

#### POST /api/admin/trainings

Create recurring training.

**Request:**
```json
{
  "name": "string",
  "dayOfWeek": "MONDAY" | "TUESDAY" | ... | "SUNDAY",
  "startTime": "HH:MM",
  "endTime": "HH:MM",
  "recurrence": "ONCE" | "WEEKLY" | "BIWEEKLY" | "MONTHLY",
  "validFrom": "date?",
  "validUntil": "date?"
}
```

#### GET /api/admin/trainings/[id]

Get training details.

#### PUT /api/admin/trainings/[id]

Update training.

#### DELETE /api/admin/trainings/[id]

Delete training (cascades).

### Training Groups

#### POST /api/admin/groups

Create training group.

**Request:**
```json
{
  "recurringTrainingId": "string",
  "name": "string",
  "sortOrder": "number?"
}
```

#### GET /api/admin/groups/[id]

Get group details.

#### PUT /api/admin/groups/[id]

Update group.

#### DELETE /api/admin/groups/[id]

Delete group.

#### GET /api/admin/groups/[id]/athletes

Get athletes in group.

#### POST /api/admin/groups/[id]/athletes

Add athletes to group.

**Request:**
```json
{
  "athleteIds": ["string"]
}
```

#### DELETE /api/admin/groups/[id]/athletes

Remove athlete from group.

**Request:**
```json
{
  "athleteId": "string"
}
```

#### GET /api/admin/groups/[id]/trainers

Get trainers in group.

#### POST /api/admin/groups/[id]/trainers

Add trainers to group.

**Request:**
```json
{
  "trainerIds": ["string"],
  "isPrimary": "boolean?"
}
```

#### DELETE /api/admin/groups/[id]/trainers

Remove trainer from group.

**Request:**
```json
{
  "trainerId": "string"
}
```

### User Management

#### POST /api/admin/athletes

Create pre-approved athlete.

**Request:**
```json
{
  "email": "string",
  "password": "string",
  "firstName": "string",
  "lastName": "string",
  "phone": "string",
  "birthDate": "date?",
  "gender": "MALE" | "FEMALE" | "OTHER",
  "youthCategory": "F" | "E" | "D",
  "competitionParticipation": "boolean",
  "hasDtbId": "boolean",
  "trainingGroupIds": ["string"]
}
```

#### GET /api/admin/trainers

List all trainers.

#### POST /api/admin/trainers

Create trainer.

**Request:**
```json
{
  "email": "string",
  "password": "string",
  "firstName": "string",
  "lastName": "string",
  "phone": "string",
  "role": "TRAINER" | "ADMIN"
}
```

#### PUT /api/admin/trainers/[id]

Update trainer (role, active status).

### Competitions

#### GET /api/admin/competitions

List competitions.

**Query Parameters:**
| Param                | Type    | Description               |
| -------------------- | ------- | ------------------------- |
| includeRegistrations | boolean | Include registration data |

#### POST /api/admin/competitions

Create competition.

**Request:**
```json
{
  "name": "string",
  "date": "datetime",
  "location": "string",
  "description": "string?",
  "minYouthCategory": "F" | "E" | "D" | null,
  "maxYouthCategory": "F" | "E" | "D" | null,
  "registrationDeadline": "datetime?",
  "maxParticipants": "number?",
  "requiresDtbId": "boolean",
  "entryFee": "number?"
}
```

#### GET /api/admin/competitions/[id]

Get competition details.

#### PUT /api/admin/competitions/[id]

Update competition.

#### DELETE /api/admin/competitions/[id]

Delete competition.

#### PUT /api/admin/competitions/[id]/publish

Publish competition.

#### PUT /api/admin/competitions/[id]/cancel

Cancel competition.

#### GET /api/admin/competitions/[id]/registrations

Get registrations for competition.

#### PUT /api/admin/competitions/[id]/registrations/[regId]

Update registration (record results).

**Request:**
```json
{
  "attended": "boolean?",
  "placement": "number?",
  "score": "number?"
}
```

### System Settings

#### GET /api/admin/settings

Get system settings.

#### PUT /api/admin/settings

Update system settings.

**Request:**
```json
{
  "cancellationDeadlineHours": "number",
  "absenceAlertThreshold": "number",
  "absenceAlertWindowDays": "number",
  "absenceAlertCooldownDays": "number",
  "absenceAlertEnabled": "boolean",
  "adminNotificationEmail": "string",
  "maxUploadSizeMB": "number",
  "sessionGenerationDaysAhead": "number"
}
```

### Trainer Hours

#### GET /api/admin/trainer-hours

Get monthly trainer hour summaries.

**Query Parameters:**
| Param | Type   | Default       |
| ----- | ------ | ------------- |
| month | number | Current month |
| year  | number | Current year  |

#### PUT /api/admin/trainer-hours/[id]

Adjust trainer hours.

**Request:**
```json
{
  "adjustedHours": "number",
  "notes": "string?"
}
```

#### GET /api/admin/trainer-hours/export

Export trainer hours as CSV.

**Query Parameters:**
| Param | Type   |
| ----- | ------ |
| month | number |
| year  | number |

### File Categories

#### GET /api/admin/file-categories

List file categories.

#### POST /api/admin/file-categories

Create category.

**Request:**
```json
{
  "name": "string",
  "description": "string?"
}
```

#### PUT /api/admin/file-categories/[id]

Update category.

#### DELETE /api/admin/file-categories/[id]

Delete category (must be empty).

### Absence Management

#### GET /api/admin/absences/alerts

Get recent absence alerts.

#### POST /api/admin/absences/[athleteId]/reset

Reset absence count for athlete.

---

## File Endpoints

### GET /api/files/[id]/download

Download file. Returns file with appropriate content-type.

---

## Validation Schemas

### Common Patterns

```typescript
// Email
z.string().email('Ungültige E-Mail-Adresse')

// Password
z.string().min(8, 'Mindestens 8 Zeichen')

// Phone
z.string().min(1, 'Telefonnummer erforderlich')

// Time (HH:MM)
z.string().regex(/^\d{2}:\d{2}$/, 'Format: HH:MM')

// Reason (for cancellations)
z.string().min(10, 'Mindestens 10 Zeichen')
```

### Enum Values

```typescript
// Gender
'MALE' | 'FEMALE' | 'OTHER'

// UserRole
'ATHLETE' | 'TRAINER' | 'ADMIN'

// YouthCategory
'F' | 'E' | 'D'

// DayOfWeek
'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'

// RecurrenceInterval
'ONCE' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'

// AttendanceStatus
'PRESENT' | 'ABSENT_EXCUSED' | 'ABSENT_UNEXCUSED'
```

---

## Error Handling

### Validation Errors

```json
{
  "error": "Ungültige Eingabe",
  "details": {
    "fieldErrors": {
      "email": ["Ungültige E-Mail-Adresse"],
      "password": ["Mindestens 8 Zeichen"]
    },
    "formErrors": []
  }
}
```

### Authorization Errors

```json
{
  "error": "Nicht authentifiziert"
}
```

```json
{
  "error": "Administrator-Berechtigung erforderlich"
}
```

### Not Found Errors

```json
{
  "error": "Training nicht gefunden"
}
```

---

## Rate Limiting

Currently no rate limiting implemented. Consider adding for production:
- Login attempts: 5 per minute
- API calls: 100 per minute per user
- File uploads: 10 per hour

---

## Pagination

For list endpoints that may return large datasets, implement cursor-based pagination:

**Request:**
```
GET /api/trainer/athletes?cursor=abc123&limit=20
```

**Response:**
```json
{
  "data": [...],
  "nextCursor": "xyz789",
  "hasMore": true
}
```