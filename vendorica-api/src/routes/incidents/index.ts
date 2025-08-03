import { Router } from 'express'
import crudRoutes from './crud.routes.js'
import enrichedRoutes from './enriched.routes.js'

const router = Router()

// Mount incident sub-routes
// Order matters: more specific routes (enriched) must come before generic ones (/:id)
router.use('/', enrichedRoutes)
router.use('/', crudRoutes)

export default router