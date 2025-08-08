import { Router } from 'express'
import { HealthController } from '@controllers/health.controller.js'

const router = Router()

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Simple health check
 *     description: Basic health status endpoint for load balancer checks
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthStatus'
 *       503:
 *         description: Service is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
/**
 * @swagger
 * /api/internal/health/detailed:
 *   get:
 *     summary: Detailed health check
 *     description: Comprehensive health status with database and service checks
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Detailed health information
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/HealthStatus'
 *       503:
 *         description: One or more services are unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
router.get('/detailed', HealthController.detailedHealthCheck)

/**
 * @swagger
 * /health/diagnostics:
 *   get:
 *     summary: Environment diagnostics (development only)
 *     description: Detailed environment configuration diagnostics for debugging
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Environment diagnostics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 diagnostics:
 *                   type: object
 *                 message:
 *                   type: string
 *       403:
 *         description: Only available in development mode
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
router.get('/diagnostics', HealthController.environmentDiagnostics)

export default router