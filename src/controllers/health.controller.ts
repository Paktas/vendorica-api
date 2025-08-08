import { Request, Response, NextFunction } from 'express'
import { HealthService } from '@services/health.service.js'
import { sendError } from '@/utils/response.util.js'

export class HealthController {
  /**
   * Basic health check
   * GET /api/health
   */
  static async simpleHealthCheck(req: Request, res: Response, next: NextFunction) {
    try {
      // Simple health check - just return basic status
      return res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        message: 'Vendorica API is operational'
      })
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
      const healthStatus = await HealthService.getHealthStatus()
      
      // Add system metrics if there are concerns
      const systemMetrics = HealthService.getSystemMetrics()
      if (systemMetrics) {
        (healthStatus as any).metrics = systemMetrics
      }

      // Return appropriate status code based on health
      const statusCode = healthStatus.status === 'healthy' ? 200 : 
                        healthStatus.status === 'degraded' ? 200 : 503

      return res.status(statusCode).json(healthStatus)
    } catch (error) {
      console.error('Detailed health check controller error:', error)
      return sendError(res, 'Health check failed', 500)
    }
  }

  /**
   * Environment diagnostics (development only)
   * GET /health/diagnostics
   */
  static async environmentDiagnostics(req: Request, res: Response, next: NextFunction) {
    try {
      if (process.env.NODE_ENV !== 'development') {
        return sendError(res, 'Diagnostics only available in development mode', 403)
      }

      const diagnostics = HealthService.getEnvironmentDiagnostics()
      return res.status(200).json({
        success: true,
        diagnostics,
        message: 'Environment diagnostics generated successfully'
      })
    } catch (error) {
      console.error('Environment diagnostics controller error:', error)
      return sendError(res, 'Failed to generate diagnostics', 500)
    }
  }
}