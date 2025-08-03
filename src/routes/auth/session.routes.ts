import { Router } from 'express'
import { AuthController } from '@controllers/auth.controller.js'
import { JwtController } from '@controllers/jwt.controller.js'

const router = Router()

/**
 * @route GET /api/internal/auth/me
 * @desc Get current user information
 * @access Private
 */
router.get('/me', AuthController.me)

/**
 * @route POST /api/internal/auth/logout
 * @desc Logout user
 * @access Private
 */
router.post('/logout', AuthController.logout)

/**
 * @route POST /api/internal/auth/refresh
 * @desc Refresh JWT token
 * @access Private
 */
router.post('/refresh', JwtController.refreshToken)

/**
 * @route POST /api/internal/auth/validate
 * @desc Validate JWT token
 * @access Private
 */
router.post('/validate', JwtController.validateToken)

export default router