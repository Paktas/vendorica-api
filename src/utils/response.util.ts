import { Response } from 'express'

export interface ApiSuccessResponse<T = any> {
  success: true
  data?: T
  message?: string
  token?: string
  timestamp: string
  requestId?: string
}

export interface ApiErrorResponse {
  success: false
  error: string
  code?: string
  details?: any
  timestamp: string
  requestId?: string
  stack?: string
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse

/**
 * Get request ID from response locals or generate one
 */
const getRequestId = (res: Response): string | undefined => {
  return (res.locals as any)?.requestId
}

/**
 * Standardized success response
 */
export const sendSuccess = <T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode: number = 200
): Response<ApiSuccessResponse<T>> => {
  return res.status(statusCode).json({
    success: true,
    ...(data && { data }),
    ...(message && { message }),
    timestamp: new Date().toISOString(),
    ...(getRequestId(res) && { requestId: getRequestId(res) })
  })
}

/**
 * Standardized success response with token
 */
export const sendSuccessWithToken = <T>(
  res: Response,
  data: T,
  token: string,
  message?: string,
  statusCode: number = 200
): Response<ApiSuccessResponse<T>> => {
  return res.status(statusCode).json({
    success: true,
    data,
    token,
    ...(message && { message }),
    timestamp: new Date().toISOString(),
    ...(getRequestId(res) && { requestId: getRequestId(res) })
  })
}

/**
 * Standardized error response
 */
export const sendError = (
  res: Response,
  error: string,
  statusCode: number = 400,
  code?: string,
  details?: any
): Response<ApiErrorResponse> => {
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  return res.status(statusCode).json({
    success: false,
    error,
    ...(code && { code }),
    ...(details && { details }),
    timestamp: new Date().toISOString(),
    ...(getRequestId(res) && { requestId: getRequestId(res) }),
    ...(isDevelopment && details instanceof Error && { stack: details.stack })
  })
}

/**
 * Common error responses
 */
export const sendUnauthorized = (res: Response, error: string = 'Unauthorized') => {
  return sendError(res, error, 401, 'UNAUTHORIZED')
}

export const sendForbidden = (res: Response, error: string = 'Forbidden') => {
  return sendError(res, error, 403, 'FORBIDDEN')
}

export const sendNotFound = (res: Response, error: string = 'Not found') => {
  return sendError(res, error, 404, 'NOT_FOUND')
}

export const sendValidationError = (res: Response, error: string, details?: any) => {
  return sendError(res, error, 422, 'VALIDATION_ERROR', details)
}

export const sendInternalError = (res: Response, error: string = 'Internal server error') => {
  return sendError(res, error, 500, 'INTERNAL_ERROR')
}

export const sendBadRequest = (res: Response, error: string = 'Bad request', details?: any) => {
  return sendError(res, error, 400, 'BAD_REQUEST', details)
}

export const sendConflict = (res: Response, error: string = 'Resource conflict', details?: any) => {
  return sendError(res, error, 409, 'CONFLICT', details)
}

export const sendTooManyRequests = (res: Response, error: string = 'Too many requests') => {
  return sendError(res, error, 429, 'TOO_MANY_REQUESTS')
}

export const sendServiceUnavailable = (res: Response, error: string = 'Service unavailable') => {
  return sendError(res, error, 503, 'SERVICE_UNAVAILABLE')
}