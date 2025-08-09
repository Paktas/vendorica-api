import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { getSupabaseClient } from '@/config/database.js'
import { LoginRequest, RegisterRequest, User, ApiResponse } from '@/types/api.types.js'
import { JwtService } from '@/services/jwt.service.js'

export class AuthService {
  /**
   * Authenticate user with email and password
   */
  static async login(request: LoginRequest): Promise<ApiResponse<{ user: User; token: string }>> {
    const { email, password } = request

    if (!email || !password) {
      return {
        success: false,
        error: 'Email and password are required'
      }
    }

    try {
      const supabase = getSupabaseClient()

      const { data: userData, error } = await supabase
        .from('users')
        .select(`
          id, email, password_hash, status, first_name, last_name, 
          role_id, organization_id,
          organization:organizations(id, name),
          role:roles(name, display_name)
        `)
        .eq('email', email.toLowerCase())
        .eq('status', 'active')
        .single()

      if (error || !userData) {
        return {
          success: false,
          error: 'Invalid login credentials!'
        }
      }

      if (!userData.password_hash) {
        return {
          success: false,
          error: 'Password authentication not set up'
        }
      }

      const isValidPassword = await bcrypt.compare(password, userData.password_hash)

      if (!isValidPassword) {
        return {
          success: false,
          error: 'Invalid login credentials!'
        }
      }

      // Update last login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userData.id)

      const user: User = {
        id: userData.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role_id: userData.role_id,
        organization_id: userData.organization_id,
        status: userData.status,
        organization: Array.isArray(userData.organization) 
          ? userData.organization[0] 
          : userData.organization,
        role: Array.isArray(userData.role) 
          ? userData.role[0] 
          : userData.role
      }

      // Generate secure JWT token
      const token = JwtService.generateToken({
        userId: user.id,
        email: user.email,
        organizationId: user.organization_id
      })

      // Add audit log entry
      try {
        await supabase
          .from('audit_trail')
          .insert({
            user_id: user.id,
            action: 'login',
            table_name: 'users',
            record_id: user.id,
            changes: { login_method: 'password' },
            timestamp: new Date().toISOString()
          })
      } catch (auditError) {
        console.error('⚠️ Audit logging failed (non-critical):', auditError)
      }

      return {
        success: true,
        data: { user, token },
        message: 'Login successful'
      }
    } catch (error) {
      console.error('Login error:', error)
      return {
        success: false,
        error: 'Internal server error'
      }
    }
  }

  /**
   * Register new user (simple registration - email and password only)
   */
  static async register(request: RegisterRequest): Promise<ApiResponse<{ user: User; token: string }>> {
    const { email, password } = request

    if (!email || !password) {
      return {
        success: false,
        error: 'Email and password are required'
      }
    }

    if (password.length < 8) {
      return {
        success: false,
        error: 'Password must be at least 8 characters long'
      }
    }

    try {
      const supabase = getSupabaseClient()

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .single()

      if (existingUser) {
        return {
          success: false,
          error: 'User with this email already exists'
        }
      }

      // Generate default values
      const defaultFirstName = email.split('@')[0] || 'User'
      const defaultLastName = ''

      // Get or create default organization
      let { data: defaultOrg } = await supabase
        .from('organizations')
        .select('id')
        .eq('name', 'Default Organization')
        .single()

      if (!defaultOrg) {
        const { data: newOrg, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: 'Default Organization',
            description: 'Default organization for new users',
            created_at: new Date().toISOString()
          })
          .select('id')
          .single()

        if (orgError || !newOrg) {
          console.error('Failed to create default organization:', orgError)
          return {
            success: false,
            error: 'Failed to set up user organization'
          }
        }
        defaultOrg = newOrg
      }

      // Get or create default role
      let { data: defaultRole } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'user')
        .single()

      if (!defaultRole) {
        const { data: newRole, error: roleError } = await supabase
          .from('roles')
          .insert({
            name: 'user',
            display_name: 'User',
            description: 'Standard user role',
            created_at: new Date().toISOString()
          })
          .select('id')
          .single()

        if (roleError || !newRole) {
          console.error('Failed to create default role:', roleError)
          return {
            success: false,
            error: 'Failed to set up user role'
          }
        }
        defaultRole = newRole
      }

      // Hash password
      const password_hash = await bcrypt.hash(password, 12)

      // Create user
      const { data: userData, error } = await supabase
        .from('users')
        .insert({
          email: email.toLowerCase(),
          password_hash,
          first_name: defaultFirstName,
          last_name: defaultLastName,
          organization_id: defaultOrg.id,
          role_id: defaultRole.id,
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select(`
          id, email, first_name, last_name, role_id, organization_id, status,
          organization:organizations(id, name),
          role:roles(name, display_name)
        `)
        .single()

      if (error || !userData) {
        console.error('Registration error:', error)
        return {
          success: false,
          error: 'Registration failed'
        }
      }

      const user: User = {
        id: userData.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role_id: userData.role_id,
        organization_id: userData.organization_id,
        status: userData.status,
        organization: Array.isArray(userData.organization) 
          ? userData.organization[0] 
          : userData.organization,
        role: Array.isArray(userData.role) 
          ? userData.role[0] 
          : userData.role
      }

      // Generate secure JWT token
      const token = JwtService.generateToken({
        userId: user.id,
        email: user.email,
        organizationId: user.organization_id
      })

      // Add audit log entry
      try {
        await supabase
          .from('audit_trail')
          .insert({
            user_id: user.id,
            action: 'register',
            table_name: 'users',
            record_id: user.id,
            changes: { registration_method: 'password' },
            timestamp: new Date().toISOString()
          })
      } catch (auditError) {
        console.error('⚠️ Audit logging failed (non-critical):', auditError)
      }

      return {
        success: true,
        data: { user, token },
        message: 'Registration successful'
      }
    } catch (error) {
      console.error('Registration service error:', error)
      return {
        success: false,
        error: 'Internal server error'
      }
    }
  }

  /**
   * Validate authentication token
   */
  static async validateToken(token: string): Promise<ApiResponse<User>> {
    try {
      // Verify JWT token
      const payload = JwtService.verifyToken(token)

      const supabase = getSupabaseClient()

      const { data: userData, error } = await supabase
        .from('users')
        .select(`
          id, email, first_name, last_name, role_id, organization_id, status,
          organization:organizations(id, name)
        `)
        .eq('id', payload.userId)
        .eq('status', 'active')
        .single()

      if (error || !userData) {
        return {
          success: false,
          error: 'User not found or inactive'
        }
      }

      // Verify organization matches token
      if (userData.organization_id !== payload.organizationId) {
        return {
          success: false,
          error: 'Token organization mismatch'
        }
      }

      const user: User = {
        id: userData.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role_id: userData.role_id,
        organization_id: userData.organization_id,
        status: userData.status,
        organization: Array.isArray(userData.organization) 
          ? userData.organization[0] 
          : userData.organization
      }

      return {
        success: true,
        data: user
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Invalid token'
      }
    }
  }

  /**
   * Logout user
   */
  static async logout(userId: string): Promise<ApiResponse> {
    try {
      const supabase = getSupabaseClient()
      
      // Add audit log entry
      await supabase
        .from('audit_trail')
        .insert({
          user_id: userId,
          action: 'logout',
          table_name: 'users',
          record_id: userId,
          changes: { logout_method: 'manual' },
          timestamp: new Date().toISOString()
        })

      return {
        success: true,
        message: 'Logout successful'
      }
    } catch (error) {
      console.error('Logout error:', error)
      return {
        success: false,
        error: 'Logout failed'
      }
    }
  }

  /**
   * Generate password reset token and send email
   */
  static async requestPasswordReset(email: string): Promise<ApiResponse> {
    if (!email) {
      return {
        success: false,
        error: 'Email is required'
      }
    }

    try {
      const supabase = getSupabaseClient()

      // Check if user exists
      const { data: userData, error } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, organization_id, organization:organizations(name)')
        .eq('email', email.toLowerCase())
        .eq('status', 'active')
        .single()

      if (error || !userData) {
        // For security, don't reveal if email exists or not
        return {
          success: true,
          message: 'If an account with that email exists, a password reset link has been sent.'
        }
      }

      // Generate secure reset token
      const resetToken = crypto.randomBytes(32).toString('hex')
      const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex')
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour

      // Store token in database
      const { error: tokenError } = await supabase
        .from('auth_password_reset_tokens')
        .insert({
          user_id: userData.id,
          token_hash: tokenHash,
          expires_at: expiresAt,
          created_at: new Date().toISOString()
        })

      if (tokenError) {
        console.error('Failed to store reset token:', tokenError)
        return {
          success: false,
          error: 'Failed to generate reset token'
        }
      }

      // Send reset email using internal email service
      try {
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
        
        const { EmailService } = await import('./email.service')
        
        const emailResult = await EmailService.sendPasswordReset({
          to: userData.email,
          firstName: userData.first_name,
          lastName: userData.last_name,
          resetUrl: resetUrl,
          organizationName: (userData.organization as any)?.name || 'Vendorica'
        })

        if (!emailResult.success) {
          console.error('Failed to send reset email:', emailResult.error)
          return {
            success: false,
            error: 'Failed to send password reset email'
          }
        }

        // Add audit log
        await supabase
          .from('audit_trail')
          .insert({
            user_id: userData.id,
            action: 'password_reset_requested',
            table_name: 'users',
            record_id: userData.id,
            changes: { email: userData.email },
            timestamp: new Date().toISOString()
          })

      } catch (emailError) {
        console.error('Email sending failed:', emailError)
        return {
          success: false,
          error: 'Failed to send password reset email'
        }
      }

      return {
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      }
    } catch (error) {
      console.error('Password reset request error:', error)
      return {
        success: false,
        error: 'Internal server error'
      }
    }
  }

  /**
   * Update password using reset token
   */
  static async updatePasswordWithToken(token: string, newPassword: string): Promise<ApiResponse> {
    if (!token || !newPassword) {
      return {
        success: false,
        error: 'Reset token and new password are required'
      }
    }

    if (newPassword.length < 8) {
      return {
        success: false,
        error: 'Password must be at least 8 characters long'
      }
    }

    try {
      const supabase = getSupabaseClient()
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

      // Find and validate token
      const { data: tokenData, error: tokenError } = await supabase
        .from('auth_password_reset_tokens')
        .select('user_id, expires_at, used_at')
        .eq('token_hash', tokenHash)
        .single()

      if (tokenError || !tokenData) {
        return {
          success: false,
          error: 'Invalid or expired reset token'
        }
      }

      // Check if token is expired
      if (new Date() > new Date(tokenData.expires_at)) {
        return {
          success: false,
          error: 'Reset token has expired'
        }
      }

      // Check if token already used
      if (tokenData.used_at) {
        return {
          success: false,
          error: 'Reset token has already been used'
        }
      }

      // Hash new password
      const password_hash = await bcrypt.hash(newPassword, 12)

      // Update password
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          password_hash,
          updated_at: new Date().toISOString()
        })
        .eq('id', tokenData.user_id)

      if (updateError) {
        console.error('Failed to update password:', updateError)
        return {
          success: false,
          error: 'Failed to update password'
        }
      }

      // Mark token as used
      await supabase
        .from('auth_password_reset_tokens')
        .update({ 
          used_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('token_hash', tokenHash)

      // Add audit log
      await supabase
        .from('audit_trail')
        .insert({
          user_id: tokenData.user_id,
          action: 'password_updated',
          table_name: 'users',
          record_id: tokenData.user_id,
          changes: { method: 'reset_token' },
          timestamp: new Date().toISOString()
        })

      return {
        success: true,
        message: 'Password updated successfully'
      }
    } catch (error) {
      console.error('Password update error:', error)
      return {
        success: false,
        error: 'Internal server error'
      }
    }
  }

  /**
   * Validate reset token (for frontend validation)
   */
  static async validateResetToken(token: string): Promise<ApiResponse> {
    if (!token) {
      return {
        success: false,
        error: 'Reset token is required'
      }
    }

    try {
      const supabase = getSupabaseClient()
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

      const { data: tokenData, error } = await supabase
        .from('auth_password_reset_tokens')
        .select('expires_at, used_at')
        .eq('token_hash', tokenHash)
        .single()

      if (error || !tokenData) {
        return {
          success: false,
          error: 'Invalid reset token'
        }
      }

      if (new Date() > new Date(tokenData.expires_at)) {
        return {
          success: false,
          error: 'Reset token has expired'
        }
      }

      if (tokenData.used_at) {
        return {
          success: false,
          error: 'Reset token has already been used'
        }
      }

      return {
        success: true,
        message: 'Token is valid'
      }
    } catch (error) {
      console.error('Token validation error:', error)
      return {
        success: false,
        error: 'Internal server error'
      }
    }
  }
}