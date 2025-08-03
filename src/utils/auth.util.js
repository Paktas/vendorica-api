/**
 * Authentication utilities for middleware
 */

/**
 * Authenticate request using AuthService
 * @param {Request} req - Node.js request object
 * @returns {Promise<Object>} Authentication result
 */
export async function authenticateRequest(req) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { success: false, error: 'Authorization header required' }
  }

  const token = authHeader.substring(7)
  const { AuthService } = await import('../services/auth.service.js')
  const result = await AuthService.validateToken(token)
  
  if (!result.success) {
    return result
  }

  // Transform user data to match controller expectations
  return {
    success: true,
    data: {
      id: result.data.id,
      email: result.data.email,
      organizationId: result.data.organization_id
    }
  }
}