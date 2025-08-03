import { Request, Response, NextFunction } from 'express'
import { createClient } from '@supabase/supabase-js'
import { sendUnauthorized, sendInternalError } from '@/utils/response.util.js'
import { UnauthorizedError } from '@/utils/errors.js'
import { JwtService } from '@/services/jwt.service.js'

interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    organizationId: string
  }
}

/**
 * Reusable authentication middleware
 * Eliminates the 8x duplication of token validation logic
 */
export const authenticateToken = async (
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendUnauthorized(res, 'Authorization token required')
    }

    const token = authHeader.substring(7)
    
    try {
      // Verify JWT token
      const payload = JwtService.verifyToken(token)
      
      // Verify user exists and is active
      const supabaseUrl = process.env.SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase configuration missing')
      }
      
      const supabase = createClient(supabaseUrl, supabaseKey)
      
      const { data: user, error } = await supabase
        .from('users')
        .select('id, email, status, organization_id')
        .eq('id', payload.userId)
        .eq('status', 'active')
        .single()
      
      if (error || !user) {
        return sendUnauthorized(res, 'User not found or inactive')
      }
      
      // Verify organization matches token
      if (user.organization_id !== payload.organizationId) {
        return sendUnauthorized(res, 'Token organization mismatch')
      }
      
      // Attach user to request
      req.user = {
        id: user.id,
        email: user.email,
        organizationId: user.organization_id
      }
      
      next()
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        return sendUnauthorized(res, error.message)
      }
      return sendUnauthorized(res, 'Invalid token')
    }
  } catch (error) {
    console.error('Auth middleware error:', error)
    return sendInternalError(res, 'Authentication error')
  }
}

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No token provided, continue without user
    return next()
  }
  
  // If token provided, validate it
  return authenticateToken(req, res, next)
}