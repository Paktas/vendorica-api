import { Request, Response, NextFunction } from 'express'

/**
 * Structured request logging middleware
 */
export const loggingMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now()
  const requestId = res.locals.requestId

  // Log request
  console.log({
    type: 'request',
    timestamp: new Date().toISOString(),
    requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent')
  })

  // Capture response
  const originalSend = res.send
  res.send = function(data: any) {
    res.send = originalSend
    const responseTime = Date.now() - startTime

    // Log response
    console.log({
      type: 'response',
      timestamp: new Date().toISOString(),
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`
    })

    return res.send(data)
  }

  next()
}