import { Request, Response, NextFunction } from 'express'
import { HealthService } from '@services/health.service.js'
import { sendSuccess, sendError } from '@/utils/response.util.js'

export class HealthController {
  /**
   * Basic health check
   * GET /api/health
   */
  static async simpleHealthCheck(req: Request, res: Response, next: NextFunction) {
    try {
      const result = HealthService.getSimpleStatus()
      return res.status(200).json(result)
    } catch (error) {
      console.error('Health check controller error:', error)
      return sendError(res, 'Health check failed', 500)
    }
  }

  /**
   * Comprehensive health check
   * GET /api/internal/health/detailed
   */
  static async detailedHealthCheck(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await HealthService.getHealthStatus()

      if (!result.success) {
        return sendError(res, result.error, 503)
      }

      // Return appropriate status code based on health
      const statusCode = result.data?.status === 'healthy' ? 200 : 
                        result.data?.status === 'degraded' ? 200 : 503

      return res.status(statusCode).json(result)
    } catch (error) {
      console.error('Detailed health check controller error:', error)
      return sendError(res, 'Health check failed', 500)
    }
  }
}