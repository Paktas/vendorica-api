import { Request, Response, NextFunction } from 'express'
import crypto from 'crypto'

/**
 * Middleware to add unique request ID for tracking
 */
export const requestIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Generate unique request ID
  const requestId = `req_${crypto.randomBytes(8).toString('hex')}`
  
  // Store in response locals for use in response utilities
  res.locals.requestId = requestId
  
  // Add to response headers
  res.setHeader('X-Request-ID', requestId)
  
  next()
}