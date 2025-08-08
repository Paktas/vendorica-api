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
  /**
   * Generate a secure JWT token
   */
  static generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    // Read from environment at runtime, not at import time
    const SECRET = process.env.JWT_SECRET
    const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'
    
    if (!SECRET) {
      // Enhanced error message with debugging context only in development
      if (process.env.NODE_ENV === 'development') {
        const envFile = '.env.development'
        const jwtKeys = Object.keys(process.env).filter(k => k.includes('JWT')).join(', ') || 'none'
        throw new Error(
          `JWT_SECRET environment variable is required. Expected in: ${envFile}. ` +
          `JWT-related keys found: ${jwtKeys}`
        )
      } else {
        throw new Error('JWT_SECRET environment variable is required')
      }
    }

    return jwt.sign(payload, SECRET, {
      expiresIn: EXPIRES_IN,
      issuer: 'vendorica-api',
      audience: 'vendorica-client'
    } as jwt.SignOptions)
  }

  /**
   * Verify and decode a JWT token
   */
  static verifyToken(token: string): JwtPayload {
    // Read from environment at runtime, not at import time
    const SECRET = process.env.JWT_SECRET
    
    if (!SECRET) {
      // Enhanced error message with debugging context only in development
      if (process.env.NODE_ENV === 'development') {
        const envFile = '.env.development'
        const jwtKeys = Object.keys(process.env).filter(k => k.includes('JWT')).join(', ') || 'none'
        throw new Error(
          `JWT_SECRET environment variable is required for token verification. Expected in: ${envFile}. ` +
          `JWT-related keys found: ${jwtKeys}`
        )
      } else {
        throw new Error('JWT_SECRET environment variable is required')
      }
    }

    try {
      const decoded = jwt.verify(token, SECRET, {
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