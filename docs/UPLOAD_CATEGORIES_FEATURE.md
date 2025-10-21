# Upload Categories Feature Implementation

## Summary

This feature allows admins to create and manage custom categories for file uploads. The system has been renamed from "Trainingspläne" (Training Plans) to "Dateien" (Files) throughout the application.

## Database Changes

### New Models

1. **UploadCategory** - Admin-managed categories for uploads
   - `id`: Unique identifier
   - `name`: Category name (unique)
   - `description`: Optional description
   - `sortOrder`: For ordering categories (default: 0)
   - `isActive`: Active status

2. **Upload** (renamed from TrainingPlan)
   - Now references `UploadCategory` via `categoryId`
   - All other fields remain the same

### Migration

Run: `npx prisma migrate dev --name add_upload_categories`

### Seed Data

Default categories created:
- Kraftziele (Strength Goals)
- Kraftübungen (Strength Exercises)
- Dehnziele (Stretching Goals)
- Dehnübungen (Stretching Exercises)
- Allgemeine Dokumente (General Documents)

## API Endpoints

### Admin Category Management

#### GET /api/admin/upload-categories
- Returns all active categories with upload count
- Available to all authenticated users
- Admin only can create/edit/delete

#### POST /api/admin/upload-categories
- Create new category (Admin only)
- Fields: `name`, `description`, `sortOrder`

#### PATCH /api/admin/upload-categories/[id]
- Update category (Admin only)
- Can update: `name`, `description`, `sortOrder`, `isActive`

#### DELETE /api/admin/upload-categories/[id]
- Delete category (Admin only)
- Cannot delete if category has uploads

### File Upload/Management

#### POST /api/trainer/files
- Upload new file (Trainers/Admins)
- Requires: `categoryId`, `title`, `file`
- Optional: `targetDate`

#### GET /api/trainer/files
- Get all uploads with category info (Trainers/Admins)

#### DELETE /api/trainer/files/[id]
- Delete upload and file (Trainers/Admins)

#### GET /api/files
- Get all active uploads (All authenticated users)
- Returns files grouped by category

#### GET /api/files/[id]/download
- Download specific file (All authenticated users)

## Frontend Pages

### Admin
- `/trainer/admin/upload-categories` - Manage categories
  - Create new categories
  - Edit existing categories
  - Delete empty categories
  - View upload count per category

### Trainer
- `/trainer/files` - Upload and manage files
  - Select category from dropdown (populated from API)
  - Upload files
  - View files grouped by category
  - Delete files

### Athlete
- `/athlete/files` - View and download files
  - Files grouped and sorted by category
  - Download functionality

## Navigation Changes

### Trainer Navigation
- "Trainingspläne" → "Dateien"
- Route: `/trainer/training-plans` → `/trainer/files`
- Admin section now includes "Datei-Kategorien"

### Athlete Navigation
- "Trainingspläne" → "Dateien"
- Route: `/athlete/training-plans` → `/athlete/files`

## Email Notifications

Updated email template for file uploads:
- Subject: "Neue Datei verfügbar" (instead of "Neue Trainingstermine verfügbar")
- Link: `/athlete/files` (instead of `/athlete/training-plans`)
- Content updated to reference "Datei" instead of "Plan"

## File Storage

- Files are stored in `/uploads/files/` directory (changed from `/uploads/training-plans/`)
- Format: `{timestamp}-{sanitized-filename}.pdf`

## Features

### Admin Capabilities
- Create custom categories with names and descriptions
- Set sort order for category display
- Cannot delete categories containing files
- Categories must have unique names

### Trainer Capabilities
- Select from available categories when uploading
- Files automatically organized by category
- View upload history with trainer info
- Delete uploaded files

### Athlete Capabilities
- View all files organized by category
- Categories sorted by admin-defined order
- Download files
- See file metadata (title, size, target date)

## Migration from Old System

The old enum-based category system has been replaced with a dynamic database-driven system. Existing uploads would need to be migrated manually if there were any, but since this is a new feature, no migration is needed.

## Future Enhancements

Possible additions:
- File versioning
- Category colors/icons
- File search/filter
- Upload history/analytics
- Multi-file upload
- File preview
