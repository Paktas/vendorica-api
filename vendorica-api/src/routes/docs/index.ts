import { Router } from 'express'
import docsRoutes from './docs.routes.js'

const router = Router()

// Mount documentation routes
router.use('/', docsRoutes)

export default router