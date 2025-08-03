/**
 * Custom error classes for standardized error handling
 */

export class ApiError extends Error {
  public statusCode: number
  public code: string
  public details?: any
  public isOperational: boolean

  constructor(
    message: string,
    statusCode: number,
    code: string,
    details?: any,
    isOperational = true
  ) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.details = details
    this.isOperational = isOperational

    Error.captureStackTrace(this, this.constructor)
  }
}

// 400 Bad Request
export class BadRequestError extends ApiError {
  constructor(message = 'Bad request', details?: any) {
    super(message, 400, 'BAD_REQUEST', details)
  }
}

// 401 Unauthorized
export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

// 403 Forbidden
export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN')
  }
}

// 404 Not Found
export class NotFoundError extends ApiError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND')
  }
}

// 409 Conflict
export class ConflictError extends ApiError {
  constructor(message = 'Resource conflict', details?: any) {
    super(message, 409, 'CONFLICT', details)
  }
}

// 422 Unprocessable Entity (Validation Error)
export class ValidationError extends ApiError {
  constructor(message = 'Validation failed', details?: any) {
    super(message, 422, 'VALIDATION_ERROR', details)
  }
}

// 429 Too Many Requests
export class TooManyRequestsError extends ApiError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'TOO_MANY_REQUESTS')
  }
}

// 500 Internal Server Error
export class InternalServerError extends ApiError {
  constructor(message = 'Internal server error', details?: any) {
    super(message, 500, 'INTERNAL_ERROR', details, false)
  }
}

// 503 Service Unavailable
export class ServiceUnavailableError extends ApiError {
  constructor(message = 'Service unavailable') {
    super(message, 503, 'SERVICE_UNAVAILABLE')
  }
}

/**
 * Type guard to check if error is ApiError
 */
export const isApiError = (error: any): error is ApiError => {
  return error instanceof ApiError
}

/**
 * Convert unknown errors to ApiError
 */
export const normalizeError = (error: any): ApiError => {
  if (isApiError(error)) {
    return error
  }

  if (error instanceof Error) {
    return new InternalServerError(error.message)
  }

  return new InternalServerError('An unknown error occurred')
}