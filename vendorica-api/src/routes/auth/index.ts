import { Router } from 'express'
import loginRoutes from './login.routes.js'
import sessionRoutes from './session.routes.js'
import registerRoutes from './register.routes.js'
import passwordRoutes from './password.routes.js'

const router = Router()

// Mount auth sub-routes
router.use('/', loginRoutes)
router.use('/', sessionRoutes)
router.use('/', registerRoutes)
router.use('/', passwordRoutes)

export default router