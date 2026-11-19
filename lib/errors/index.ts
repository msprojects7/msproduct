import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AuthorizationError } from '@/lib/auth/permissions';

/**
 * Standard Application Error
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly fieldErrors?: Record<string, string>;

  constructor(
    message: string,
    statusCode = 500,
    code = 'INTERNAL_ERROR',
    fieldErrors?: Record<string, string>
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, fieldErrors?: Record<string, string>) {
    super(message, 400, 'VALIDATION_ERROR', fieldErrors);
    this.name = 'ValidationError';
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, code = 'BAD_REQUEST') {
    super(message, 400, code);
    this.name = 'BadRequestError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required. Please sign in.') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action.') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found.`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

export class PayloadTooLargeError extends AppError {
  constructor(message = 'The uploaded payload exceeds the maximum allowed size.') {
    super(message, 413, 'PAYLOAD_TOO_LARGE');
    this.name = 'PayloadTooLargeError';
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests. Please try again later.') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
  }
}

export interface ApiErrorResponse {
  error: string;
  code: string;
  correlationId: string;
  fieldErrors?: Record<string, string>;
}

/**
 * Sanitizes and formats any caught error into a safe, uniform API response.
 * Completely eliminates stack traces, database queries, and internal details from client payloads.
 */
export function handleApiError(
  err: unknown,
  fallbackMessage = 'An unexpected error occurred while processing your request.'
): NextResponse<ApiErrorResponse> {
  const correlationId = `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  // 1. Zod Validation Error
  if (err instanceof ZodError) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of err.issues) {
      const fieldPath = issue.path.join('.') || 'body';
      fieldErrors[fieldPath] = issue.message;
    }

    const payload: ApiErrorResponse = {
      error: 'Invalid request data. Please check the highlighted fields.',
      code: 'VALIDATION_ERROR',
      correlationId,
      fieldErrors,
    };

    return NextResponse.json(payload, {
      status: 400,
      headers: { 'X-Correlation-Id': correlationId },
    });
  }

  // 2. Authorization / RBAC Error
  if (err instanceof AuthorizationError) {
    const payload: ApiErrorResponse = {
      error: err.message,
      code: err.code || 'AUTHORIZATION_ERROR',
      correlationId,
    };

    return NextResponse.json(payload, {
      status: err.statusCode || 403,
      headers: { 'X-Correlation-Id': correlationId },
    });
  }

  // 3. Known AppError
  if (err instanceof AppError) {
    const payload: ApiErrorResponse = {
      error: err.message,
      code: err.code,
      correlationId,
      ...(err.fieldErrors ? { fieldErrors: err.fieldErrors } : {}),
    };

    return NextResponse.json(payload, {
      status: err.statusCode,
      headers: { 'X-Correlation-Id': correlationId },
    });
  }

  // 4. Database Unique Constraint Violation (Postgres 23505)
  const isUniqueViolation =
    (err as any)?.code === '23505' ||
    (err as any)?.cause?.code === '23505';

  if (isUniqueViolation) {
    const payload: ApiErrorResponse = {
      error: 'A duplicate record already exists or is currently being processed.',
      code: 'CONFLICT',
      correlationId,
    };

    return NextResponse.json(payload, {
      status: 409,
      headers: { 'X-Correlation-Id': correlationId },
    });
  }

  // 5. Unexpected / Database / Runtime Error
  const rawMessage = err instanceof Error ? err.message : String(err);

  // Secure server-side diagnostic logging (never output credentials or full request payloads)
  console.error(`[API_ERROR][${correlationId}]`, {
    name: err instanceof Error ? err.name : 'UnknownError',
    message: rawMessage,
    // Keep stack trace strictly on server stdout for debugging
    stack: err instanceof Error ? err.stack?.split('\n').slice(0, 3).join(' ') : undefined,
  });

  // Client receives clean, safe error
  const payload: ApiErrorResponse = {
    error: fallbackMessage,
    code: 'INTERNAL_SERVER_ERROR',
    correlationId,
  };

  return NextResponse.json(payload, {
    status: 500,
    headers: { 'X-Correlation-Id': correlationId },
  });
}
