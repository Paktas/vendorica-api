import { Router } from 'express'
import { DocsController } from '@controllers/docs.controller.js'

const router = Router()

/**
 * @route GET /docs
 * @desc Interactive API documentation using Scalar
 * @access Public
 */
router.get('/', DocsController.serveSwaggerUI)

/**
 * @route GET /docs/spec.json
 * @desc OpenAPI 3.0 specification as JSON
 * @access Public
 */
router.get('/spec.json', DocsController.serveOpenAPISpec)

export default router