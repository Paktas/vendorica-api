import { Request, Response, NextFunction } from 'express'
import { sendError, sendInternalError } from '@/utils/response.util.js'
import { ApiError, isApiError } from '@/utils/errors.js'

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error for monitoring
  console.error('Error:', {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    error: err.message,
    stack: err.stack
  })

  // Handle known API errors
  if (isApiError(err)) {
    return sendError(res, err.message, err.statusCode, err.code, err.details)
  }

  // Handle validation errors from libraries
  if (err.name === 'ValidationError') {
    return sendError(res, 'Validation failed', 422, 'VALIDATION_ERROR', err)
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid token', 401, 'INVALID_TOKEN')
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Token expired', 401, 'TOKEN_EXPIRED')
  }

  // Handle database errors
  if (err.message?.includes('duplicate key')) {
    return sendError(res, 'Resource already exists', 409, 'DUPLICATE_RESOURCE')
  }

  // Default to internal server error
  const isDevelopment = process.env.NODE_ENV === 'development'
  return sendInternalError(
    res,
    isDevelopment ? err.message : 'An unexpected error occurred'
  )
}

/**
 * Async error wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}