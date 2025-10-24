import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class FileRepository {
  /**
   * Find upload by ID
   */
  async findById(id: string) {
    return prisma.upload.findUnique({
      where: { id },
      include: {
        category: true,
        uploadedByTrainer: true,
      },
    });
  }

  /**
   * Get all uploads with filters
   */
  async findMany(params: {
    where?: Prisma.UploadWhereInput;
    include?: Prisma.UploadInclude;
    orderBy?: Prisma.UploadOrderByWithRelationInput;
    skip?: number;
    take?: number;
  }) {
    return prisma.upload.findMany(params);
  }

  /**
   * Get active uploads by category
   */
  async findByCategory(categoryId: string) {
    return prisma.upload.findMany({
      where: {
        categoryId,
        isActive: true,
      },
      include: {
        category: true,
        uploadedByTrainer: true,
      },
      orderBy: [
        { targetDate: 'desc' },
        { uploadedAt: 'desc' },
      ],
    });
  }

  /**
   * Create upload
   */
  async create(data: Prisma.UploadCreateInput) {
    return prisma.upload.create({
      data,
      include: {
        category: true,
        uploadedByTrainer: true,
      },
    });
  }

  /**
   * Update upload
   */
  async update(id: string, data: Prisma.UploadUpdateInput) {
    return prisma.upload.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete upload (soft delete by marking inactive)
   */
  async softDelete(id: string) {
    return prisma.upload.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Hard delete upload
   */
  async delete(id: string) {
    return prisma.upload.delete({ where: { id } });
  }

  /**
   * Find category by ID
   */
  async findCategoryById(id: string) {
    return prisma.uploadCategory.findUnique({
      where: { id },
      include: {
        uploads: {
          where: { isActive: true },
        },
      },
    });
  }

  /**
   * Get all categories
   */
  async findAllCategories(activeOnly: boolean = true) {
    return prisma.uploadCategory.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      include: {
        _count: {
          select: {
            uploads: {
              where: { isActive: true },
            },
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Create category
   */
  async createCategory(data: Prisma.UploadCategoryCreateInput) {
    return prisma.uploadCategory.create({ data });
  }

  /**
   * Update category
   */
  async updateCategory(id: string, data: Prisma.UploadCategoryUpdateInput) {
    return prisma.uploadCategory.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete category
   */
  async deleteCategory(id: string) {
    return prisma.uploadCategory.delete({ where: { id } });
  }

  /**
   * Count uploads
   */
  async count(where?: Prisma.UploadWhereInput) {
    return prisma.upload.count({ where });
  }

  /**
   * Search uploads
   */
  async search(query: string, categoryId?: string) {
    const where: Prisma.UploadWhereInput = {
      isActive: true,
      ...(categoryId && { categoryId }),
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { fileName: { contains: query, mode: 'insensitive' } },
        { targetDate: { contains: query, mode: 'insensitive' } },
      ],
    };

    return prisma.upload.findMany({
      where,
      include: {
        category: true,
        uploadedByTrainer: true,
      },
      orderBy: { uploadedAt: 'desc' },
    });
  }
}

export const fileRepository = new FileRepository();