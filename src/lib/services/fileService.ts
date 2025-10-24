import { fileRepository } from '@/lib/repositories/fileRepository';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { APP_CONSTANTS } from '@/lib/constants/statuses';

export class FileService {
  private uploadDir = process.env.UPLOAD_DIR || './uploads/training-plans';

  /**
   * Ensure upload directory exists
   */
  private async ensureUploadDir() {
    if (!existsSync(this.uploadDir)) {
      await mkdir(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Upload file
   */
  async uploadFile(
    categoryId: string,
    title: string,
    file: File,
    uploadedBy: string,
    targetDate?: string
  ) {
    // Validate file
    if (file.size > APP_CONSTANTS.MAX_FILE_SIZE_BYTES) {
      throw new Error(`Datei darf maximal ${APP_CONSTANTS.MAX_FILE_SIZE_MB}MB groß sein`);
    }

    if (!APP_CONSTANTS.ALLOWED_FILE_TYPES.includes(file.type as 'application/pdf')) {
      throw new Error('Nur PDF-Dateien sind erlaubt');
    }

    // Ensure directory exists
    await this.ensureUploadDir();

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}-${sanitizedFilename}`;
    const filepath = path.join(this.uploadDir, filename);

    // Write file
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    // Create database record
    return fileRepository.create({
      category: { connect: { id: categoryId } },
      title,
      targetDate,
      filePath: filepath,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      uploadedByTrainer: { connect: { id: uploadedBy } },
      uploadedAt: new Date(),
    });
  }

  /**
   * Update file metadata
   */
  async updateFile(uploadId: string, data: {
    title?: string;
    targetDate?: string;
    categoryId?: string;
  }) {
    return fileRepository.update(uploadId, {
      ...(data.title && { title: data.title }),
      ...(data.targetDate !== undefined && { targetDate: data.targetDate }),
      ...(data.categoryId && { category: { connect: { id: data.categoryId } } }),
    });
  }

  /**
   * Delete file
   */
  async deleteFile(uploadId: string) {
    const upload = await fileRepository.findById(uploadId);
    if (!upload) {
      throw new Error('Datei nicht gefunden');
    }

    // Delete physical file
    try {
      await unlink(upload.filePath);
    } catch (error) {
      console.error('Failed to delete physical file:', error);
    }

    // Delete database record
    return fileRepository.delete(uploadId);
  }

  /**
   * Get file by ID
   */
  async getFile(uploadId: string) {
    return fileRepository.findById(uploadId);
  }

  /**
   * Get files by category
   */
  async getFilesByCategory(categoryId: string) {
    return fileRepository.findByCategory(categoryId);
  }

  /**
   * Get all files
   */
  async getAllFiles() {
    return fileRepository.findMany({
      where: { isActive: true },
      include: {
        category: true,
        uploadedByTrainer: true,
      },
      orderBy: {
        uploadedAt: 'desc',
      },
    });
  }

  /**
   * Search files
   */
  async searchFiles(query: string, categoryId?: string) {
    return fileRepository.search(query, categoryId);
  }

  /**
   * Create category
   */
  async createCategory(name: string, description?: string, sortOrder?: number) {
    return fileRepository.createCategory({
      name,
      description,
      sortOrder: sortOrder ?? 0,
    });
  }

  /**
   * Update category
   */
  async updateCategory(categoryId: string, data: {
    name?: string;
    description?: string;
    sortOrder?: number;
    isActive?: boolean;
  }) {
    return fileRepository.updateCategory(categoryId, data);
  }

  /**
   * Delete category
   */
  async deleteCategory(categoryId: string) {
    // Check if category has files
    const fileCount = await fileRepository.count({
      categoryId,
      isActive: true,
    });

    if (fileCount > 0) {
      throw new Error('Kategorie kann nicht gelöscht werden: Es existieren noch Dateien');
    }

    return fileRepository.deleteCategory(categoryId);
  }

  /**
   * Get all categories
   */
  async getAllCategories(activeOnly: boolean = true) {
    return fileRepository.findAllCategories(activeOnly);
  }
}

export const fileService = new FileService();