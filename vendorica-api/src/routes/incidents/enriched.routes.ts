import { Router } from 'express'
import { IncidentController } from '@controllers/incident.controller.js'
import { authenticateToken } from '@middleware/auth.middleware.js'

const router = Router()

/**
 * @route GET /api/internal/incidents/:id/enriched
 * @desc Get enriched incident data with external system integration
 * @access Private
 */
router.get('/:id/enriched', authenticateToken, IncidentController.getEnrichedIncident)

export default router