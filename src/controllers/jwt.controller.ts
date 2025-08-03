import { Request, Response } from 'express'
import { JwtService } from '@/services/jwt.service.js'
import { 
  sendSuccess, 
  sendUnauthorized, 
  sendInternalError 
} from '@/utils/response.util.js'

export class JwtController {
  /**
   * Refresh JWT token
   * POST /api/internal/auth/refresh
   */
  static async refreshToken(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return sendUnauthorized(res, 'Authorization token required')
      }

      const token = authHeader.substring(7)

      try {
        const newToken = JwtService.refreshToken(token)
        const payload = JwtService.verifyToken(newToken)

        sendSuccess(res, {
          token: newToken,
          tokenType: 'Bearer',
          user: {
            id: payload.userId,
            email: payload.email,
            organizationId: payload.organizationId
          },
          expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : null
        }, 'Token refreshed successfully')

      } catch (error) {
        return sendUnauthorized(res, 'Invalid or expired token')
      }

    } catch (error) {
      console.error('Token refresh error:', error)
      sendInternalError(res, 'Token refresh failed')
    }
  }

  /**
   * Validate token endpoint
   * POST /api/internal/auth/validate
   */
  static async validateToken(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return sendUnauthorized(res, 'Authorization token required')
      }

      const token = authHeader.substring(7)

      try {
        const payload = JwtService.verifyToken(token)

        sendSuccess(res, {
          valid: true,
          user: {
            id: payload.userId,
            email: payload.email,
            organizationId: payload.organizationId
          },
          issuedAt: payload.iat ? new Date(payload.iat * 1000).toISOString() : null,
          expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : null
        }, 'Token is valid')

      } catch (error) {
        return sendUnauthorized(res, 'Invalid or expired token')
      }

    } catch (error) {
      console.error('Token validation error:', error)
      sendInternalError(res, 'Token validation failed')
    }
  }
}