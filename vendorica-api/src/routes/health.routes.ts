import { Router } from 'express'
import { HealthController } from '@controllers/health.controller.js'

const router = Router()

// Health check endpoints
router.get('/health', HealthController.simpleHealthCheck)
router.get('/health/detailed', HealthController.detailedHealthCheck)

export default router