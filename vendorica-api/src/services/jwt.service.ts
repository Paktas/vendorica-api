import jwt from 'jsonwebtoken'
import { UnauthorizedError } from '@/utils/errors.js'
import { config } from '@/config/environment.js'

export interface JwtPayload {
  userId: string
  email: string
  organizationId: string
  iat?: number
  exp?: number
}

export class JwtService {
  private static readonly SECRET = config.auth.jwtSecret
  private static readonly EXPIRES_IN = config.auth.jwtExpiresIn

  /**
   * Generate a secure JWT token
   */
  static generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    if (!this.SECRET) {
      throw new Error('JWT_SECRET environment variable is required')
    }

    return jwt.sign(payload, this.SECRET, {
      expiresIn: this.EXPIRES_IN,
      issuer: 'vendorica-api',
      audience: 'vendorica-client'
    } as jwt.SignOptions)
  }

  /**
   * Verify and decode a JWT token
   */
  static verifyToken(token: string): JwtPayload {
    if (!this.SECRET) {
      throw new Error('JWT_SECRET environment variable is required')
    }

    try {
      const decoded = jwt.verify(token, this.SECRET, {
        issuer: 'vendorica-api',
        audience: 'vendorica-client'
      }) as JwtPayload

      return decoded
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Token has expired')
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid token')
      } else {
        throw new UnauthorizedError('Token verification failed')
      }
    }
  }

  /**
   * Refresh a token (generate new token with same payload)
   */
  static refreshToken(token: string): string {
    const payload = this.verifyToken(token)
    
    // Remove JWT specific fields before regenerating
    const { iat, exp, ...userPayload } = payload
    
    return this.generateToken(userPayload)
  }

  /**
   * Decode token without verification (useful for debugging)
   */
  static decodeToken(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload
    } catch {
      return null
    }
  }
}