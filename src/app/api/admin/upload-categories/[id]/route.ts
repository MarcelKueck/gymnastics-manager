// src/app/api/admin/upload-categories/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, sortOrder, isActive } = body;
    const params = await props.params;

    // Check if category exists
    const existingCategory = await prisma.uploadCategory.findUnique({
      where: { id: params.id },
    });

    if (!existingCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // If name is being changed, check for duplicates
    if (name && name !== existingCategory.name) {
      const duplicateCategory = await prisma.uploadCategory.findUnique({
        where: { name: name.trim() },
      });

      if (duplicateCategory) {
        return NextResponse.json(
          { error: 'A category with this name already exists' },
          { status: 400 }
        );
      }
    }

    const category = await prisma.uploadCategory.update({
      where: { id: params.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Update upload category error:', error);
    return NextResponse.json(
      { error: 'Failed to update upload category' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await props.params;

    // Check if category exists
    const category = await prisma.uploadCategory.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            uploads: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Don't allow deletion if there are uploads in this category
    if (category._count.uploads > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete category with ${category._count.uploads} upload(s). Please move or delete the uploads first.`,
        },
        { status: 400 }
      );
    }

    await prisma.uploadCategory.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete upload category error:', error);
    return NextResponse.json(
      { error: 'Failed to delete upload category' },
      { status: 500 }
    );
  }
}
