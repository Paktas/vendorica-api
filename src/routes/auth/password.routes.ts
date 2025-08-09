import { Router } from 'express'
import { AuthController } from '@controllers/auth.controller.js'

const router = Router()

/**
 * @route POST /api/internal/auth/forgot-password
 * @desc Request password reset email
 * @access Public
 */
router.post('/forgot-password', AuthController.resetPassword)

/**
 * @route POST /api/internal/auth/reset-password
 * @desc Update password using reset token
 * @access Public
 */
router.post('/reset-password', AuthController.updatePassword)

export default router