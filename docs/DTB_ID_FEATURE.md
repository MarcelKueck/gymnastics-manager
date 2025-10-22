# DTB-ID Feature Implementation

## Overview
Added a new field to track whether an athlete has a DTB-ID (Deutscher Turner-Bund ID) available. This field appears alongside the competition participation checkbox and can be managed by trainers.

## Changes Made

### 1. Database Schema (`prisma/schema.prisma`)
- Added `hasDtbId` boolean field to the `Athlete` model (defaults to `false`)
- Created migration: `20251022163306_add_dtb_id_field`

### 2. Athlete Profile Page (`src/app/athlete/profile/page.tsx`)
- Updated `AthleteProfile` interface to include `hasDtbId: boolean`
- Added DTB-ID display in the Training Configuration section
- Shows green checkmark (✓ Ja) if DTB-ID is available, red X (✗ Nein) if not

### 3. Approval Modal (`src/components/trainer/approval-modal.tsx`)
- Added `hasDtbId` to `TrainingConfig` interface
- Updated initial state to include `hasDtbId: false`
- Added checkbox for "DTB-ID ist vorhanden" under "Wettkampfteilnahme & DTB-ID" section
- Updated API call to include `hasDtbId` when approving athletes

### 4. Edit Config Modal (`src/components/trainer/edit-config-modal.tsx`)
- Updated `EditConfigModalProps` athlete interface to include `hasDtbId`
- Added `hasDtbId` to `TrainingConfig` interface
- Initialized `hasDtbId` from athlete data
- Added checkbox for "DTB-ID ist vorhanden" in the edit form
- Config object now includes `hasDtbId` when updating

### 5. API Routes

#### Admin Approve (`src/app/api/admin/athletes/approve/route.ts`)
- Added `hasDtbId` to request body extraction
- Updated athlete record creation to include `hasDtbId: Boolean(hasDtbId)`

#### Trainer Approve (`src/app/api/trainer/athletes/approve/route.ts`)
- Added `hasDtbId` to request body extraction
- Updated athlete record creation to include `hasDtbId: Boolean(hasDtbId)`

#### Config Update (`src/app/api/trainer/athletes/[id]/config/route.ts`)
- Added support for both direct fields and nested config object format
- Added `hasDtbId` to extracted fields
- Updated athlete record to include `hasDtbId` (only if provided)

#### Athlete Profile API (`src/app/api/athlete/profile/route.ts`)
- Added `hasDtbId: true` to athlete select query

#### Trainer Athletes API (`src/app/api/trainer/athletes/route.ts`)
- Added `hasDtbId: true` to athlete select query (list view)

#### Trainer Athlete Detail API (`src/app/api/trainer/athletes/[id]/route.ts`)
- Added `hasDtbId: true` to athlete select query (detail view)

### 6. Athlete Detail Interface (`src/app/trainer/athletes/[id]/page.tsx`)
- Updated `AthleteDetail` interface to include `hasDtbId: boolean`

### 7. Seed Data (`prisma/seed.ts`)
- Updated test athlete to include `hasDtbId: true`

## User Interface

### For Athletes
Athletes can see the DTB-ID status in their profile under "Trainingskonfiguration":
```
├─ Jugendkategorie: E Jugend
├─ Wettkampffreigabe: ✓ Ja / ✗ Nein
└─ DTB-ID vorhanden: ✓ Ja / ✗ Nein
```

### For Trainers/Admins

#### When Approving New Athletes
The approval modal includes a checkbox in the "Wettkampfteilnahme & DTB-ID" section:
- ☐ Athletin nimmt an Wettkämpfen teil
- ☐ DTB-ID ist vorhanden

#### When Editing Athlete Configuration
The edit config modal includes the same checkbox structure for updating athlete settings.

## Database Migration

Run the migration to add the field:
```bash
npx prisma migrate dev --name add_dtb_id_field
```

The migration adds:
```sql
ALTER TABLE "Athlete" ADD COLUMN "hasDtbId" BOOLEAN NOT NULL DEFAULT false;
```

## Testing

1. **New Athlete Registration**:
   - Admin approves an athlete
   - Can check/uncheck "DTB-ID ist vorhanden"
   - Athlete sees the status in their profile

2. **Edit Existing Athlete**:
   - Trainer opens edit config modal
   - Can toggle DTB-ID status
   - Changes are saved and reflected in athlete profile

3. **Athlete Profile View**:
   - Athletes see their DTB-ID status as read-only
   - Status displays with appropriate icon (✓ or ✗)

## Notes
- The field defaults to `false` for all existing athletes
- Only trainers and admins can modify this field
- The field is displayed alongside competition participation for easy reference
- This is purely an administrative flag - no business logic depends on this value
