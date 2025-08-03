import { Router } from 'express'
import healthRoutes from './health.routes.js'

const router = Router()

// Mount health sub-routes
router.use('/', healthRoutes)

export default router