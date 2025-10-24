import { NextResponse } from 'next/server';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Success response helper
 */
export function successResponse<T>(data: T, status: number = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

/**
 * Error response helper
 */
export function errorResponse(error: string, status: number = 400): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status }
  );
}

/**
 * Message response helper
 */
export function messageResponse(message: string, status: number = 200): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: true,
      message,
    },
    { status }
  );
}

/**
 * Not found response
 */
export function notFoundResponse(resource: string = 'Resource'): NextResponse<ApiResponse> {
  return errorResponse(`${resource} nicht gefunden`, 404);
}

/**
 * Unauthorized response
 */
export function unauthorizedResponse(message: string = 'Nicht autorisiert'): NextResponse<ApiResponse> {
  return errorResponse(message, 401);
}

/**
 * Forbidden response
 */
export function forbiddenResponse(message: string = 'Zugriff verweigert'): NextResponse<ApiResponse> {
  return errorResponse(message, 403);
}

/**
 * Validation error response
 */
export function validationErrorResponse(errors: Record<string, string>): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: 'Validierungsfehler',
      data: errors,
    },
    { status: 422 }
  );
}

/**
 * Internal server error response
 */
export function serverErrorResponse(message: string = 'Interner Serverfehler'): NextResponse<ApiResponse> {
  return errorResponse(message, 500);
}