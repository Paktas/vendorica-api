import { Request, Response, NextFunction } from 'express'
import { AuthService } from '@services/auth.service.js'
import { sendSuccess, sendError, sendUnauthorized } from '@/utils/response.util.js'
import { LoginRequest, RegisterRequest } from '@/types/api.types.js'

interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
  }
}

export class AuthController {
  /**
   * Login user
   * POST /api/internal/auth/login
   */
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password }: LoginRequest = req.body

      if (!email || !password) {
        return sendError(res, 'Email and password are required', 400)
      }

      const result = await AuthService.login({ email, password })

      if (!result.success) {
        return sendUnauthorized(res, result.error)
      }

      return res.status(200).json({
        success: true,
        token: result.data?.token,
        user: result.data?.user,
        message: result.message
      })
    } catch (error) {
      // Enhanced error logging with context for debugging
      const errorMessage = error instanceof Error ? error.message : String(error)
      const errorStack = error instanceof Error ? error.stack : undefined
      
      const errorDetails = {
        message: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
        email: req.body?.email ? 'provided' : 'missing',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'none'
      }
      
      console.error('Login controller error:', errorDetails)
      
      // Check for specific JWT errors to provide better user feedback
      if (errorMessage?.includes('JWT_SECRET')) {
        console.error('🔥 CRITICAL: JWT configuration error detected')
        return sendError(res, 'Authentication service temporarily unavailable', 503)
      }
      
      return sendError(res, 'Internal server error', 500)
    }
  }

  /**
   * Register user
   * POST /api/internal/auth/register
   */
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const registerData: RegisterRequest = req.body

      const result = await AuthService.register(registerData)

      if (!result.success) {
        return sendError(res, result.error, 400)
      }

      return res.status(201).json({
        success: true,
        token: result.data?.token,
        user: result.data?.user,
        message: 'Registration successful'
      })
    } catch (error) {
      console.error('Register controller error:', error)
      return sendError(res, 'Internal server error', 500)
    }
  }

  /**
   * Get current user
   * GET /api/internal/auth/me
   */
  static async me(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return sendUnauthorized(res, 'Authorization token required')
      }

      const token = authHeader.substring(7)
      const result = await AuthService.validateToken(token)

      if (!result.success) {
        return sendUnauthorized(res, result.error)
      }

      return sendSuccess(res, result.data, 'User retrieved successfully')
    } catch (error) {
      console.error('Me controller error:', error)
      return sendError(res, 'Internal server error', 500)
    }
  }

  /**
   * Logout user
   * POST /api/internal/auth/logout
   */
  static async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return sendSuccess(res, null, 'Logout successful')
      }

      const token = authHeader.substring(7)
      
      try {
        const { JwtService } = await import('@/services/jwt.service.js')
        const payload = JwtService.verifyToken(token)
        await AuthService.logout(payload.userId)
      } catch (tokenError) {
        console.log('⚠️ Could not parse token for audit logging:', tokenError)
      }

      return sendSuccess(res, null, 'Logout successful')
    } catch (error) {
      console.error('Logout controller error:', error)
      return sendError(res, 'Internal server error', 500)
    }
  }

  /**
   * Request password reset
   * POST /api/internal/auth/reset-password
   */
  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body

      if (!email) {
        return sendError(res, 'Email is required', 400)
      }

      const result = await AuthService.requestPasswordReset(email)

      if (!result.success) {
        return sendError(res, result.error, 400)
      }

      return sendSuccess(res, null, result.message)
    } catch (error) {
      console.error('Reset password controller error:', error)
      return sendError(res, 'Internal server error', 500)
    }
  }

  /**
   * Update password with reset token
   * POST /api/internal/auth/update-password
   */
  static async updatePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, password } = req.body

      if (!token || !password) {
        return sendError(res, 'Reset token and new password are required', 400)
      }

      const result = await AuthService.updatePasswordWithToken(token, password)

      if (!result.success) {
        return sendError(res, result.error, 400)
      }

      return sendSuccess(res, null, result.message)
    } catch (error) {
      console.error('Update password controller error:', error)
      return sendError(res, 'Internal server error', 500)
    }
  }

  /**
   * Send user invitation email
   * POST /api/internal/auth/invite
   */
  static async invite(req: Request, res: Response, next: NextFunction) {
    try {
      const { recipientEmail, firstName, lastName, organizationName, inviterName, inviteUrl } = req.body

      if (!recipientEmail || !organizationName || !inviterName || !inviteUrl) {
        return sendError(res, 'Missing required fields: recipientEmail, organizationName, inviterName, inviteUrl', 400)
      }

      // Use EmailService to send invitation
      const { EmailService } = await import('../services/email.service')
      const result = await EmailService.sendUserInvitation({
        to: recipientEmail,
        inviterName,
        organizationName,
        inviteUrl,
        recipientName: firstName ? `${firstName} ${lastName || ''}`.trim() : undefined
      })

      if (!result.success) {
        return sendError(res, result.error, 500)
      }

      return res.status(200).json({
        success: true,
        message: result.message,
        emailId: result.data?.emailId
      })
    } catch (error) {
      console.error('Invite controller error:', error)
      return sendError(res, 'Internal server error', 500)
    }
  }
}