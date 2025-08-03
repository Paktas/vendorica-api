import { Router } from 'express'

// Import domain route modules
import authRoutes from './auth/index.js'
import incidentRoutes from './incidents/index.js'
import healthRoutes from './health/index.js'

const router = Router()

// Mount domain routes with their base paths
router.use('/auth', authRoutes)
router.use('/incidents', incidentRoutes)
router.use('/health', healthRoutes)

export default router