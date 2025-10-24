import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { errorResponse, validationErrorResponse, serverErrorResponse } from './responseHelpers';

/**
 * Handle API errors uniformly
 */
export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);

  // Zod validation errors
  if (error instanceof ZodError) {
    const errors: Record<string, string> = {};
    error.errors.forEach((err) => {
      const path = err.path.join('.');
      errors[path] = err.message;
    });
    return validationErrorResponse(errors);
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return errorResponse('Ein Eintrag mit diesen Daten existiert bereits', 409);
      case 'P2025':
        return errorResponse('Eintrag nicht gefunden', 404);
      case 'P2003':
        return errorResponse('Ungültige Referenz', 400);
      case 'P2016':
        return errorResponse('Ungültige Abfrage', 400);
      default:
        return serverErrorResponse('Datenbankfehler');
    }
  }

  // Custom application errors
  if (error instanceof Error) {
    return errorResponse(error.message, 400);
  }

  // Unknown errors
  return serverErrorResponse();
}

/**
 * Async error wrapper for API routes
 */
export function asyncHandler(
  handler: (req: Request, context?: any) => Promise<NextResponse>
) {
  return async (req: Request, context?: any) => {
    try {
      return await handler(req, context);
    } catch (error) {
      return handleApiError(error);
    }
  };
}