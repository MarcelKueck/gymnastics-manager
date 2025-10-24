import { z } from 'zod';
import { APP_CONSTANTS } from '@/lib/constants/statuses';

export const uploadCategorySchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein'),
  description: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const fileUploadSchema = z.object({
  categoryId: z.string().cuid('Ungültige Kategorie-ID'),
  title: z.string().min(3, 'Titel muss mindestens 3 Zeichen lang sein'),
  targetDate: z.string().optional(),
  file: z.instanceof(File).refine(
    (file) => file.size <= APP_CONSTANTS.MAX_FILE_SIZE_BYTES,
    `Datei darf maximal ${APP_CONSTANTS.MAX_FILE_SIZE_MB}MB groß sein`
  ).refine(
    (file) => APP_CONSTANTS.ALLOWED_FILE_TYPES.includes(file.type as 'application/pdf'),
    'Nur PDF-Dateien sind erlaubt'
  ),
});

export const fileUpdateSchema = z.object({
  uploadId: z.string().cuid('Ungültige Upload-ID'),
  title: z.string().min(3, 'Titel muss mindestens 3 Zeichen lang sein').optional(),
  targetDate: z.string().optional(),
  categoryId: z.string().cuid('Ungültige Kategorie-ID').optional(),
});

export const fileSearchSchema = z.object({
  categoryId: z.string().cuid().optional(),
  query: z.string().optional(),
  activeOnly: z.boolean().optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
});

export type UploadCategoryInput = z.infer<typeof uploadCategorySchema>;
export type FileUploadInput = z.infer<typeof fileUploadSchema>;
export type FileUpdateInput = z.infer<typeof fileUpdateSchema>;
export type FileSearchInput = z.infer<typeof fileSearchSchema>;