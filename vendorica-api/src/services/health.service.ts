import { getSupabaseClient } from '@/config/database.js'
import { ApiResponse } from '@/types/api.types.js'

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  services: {
    database: 'healthy' | 'unhealthy'
    email: 'healthy' | 'unhealthy' | 'unknown'
  }
  uptime: number
}

export class HealthService {
  private static startTime = Date.now()

  /**
   * Get comprehensive health status
   */
  static async getHealthStatus(): Promise<ApiResponse<HealthStatus>> {
    try {
      const services = await this.checkServices()
      
      const status: HealthStatus = {
        status: this.determineOverallStatus(services),
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        services,
        uptime: Math.floor((Date.now() - this.startTime) / 1000) // seconds
      }

      return {
        success: true,
        data: status,
        message: 'Health check completed'
      }
    } catch (error) {
      console.error('Health check error:', error)
      return {
        success: false,
        error: 'Health check failed'
      }
    }
  }

  /**
   * Get simple health status (for basic health checks)
   */
  static getSimpleStatus(): ApiResponse<{ status: string; timestamp: string }> {
    return {
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString()
      },
      message: 'Vendorica API is healthy'
    }
  }

  /**
   * Check individual service health
   */
  private static async checkServices(): Promise<HealthStatus['services']> {
    const services: HealthStatus['services'] = {
      database: 'unhealthy',
      email: 'unknown'
    }

    // Check database connectivity
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from('users')
        .select('id')
        .limit(1)

      services.database = error ? 'unhealthy' : 'healthy'
    } catch (error) {
      console.error('Database health check failed:', error)
      services.database = 'unhealthy'
    }

    // Check email service (Resend API)
    try {
      const resendApiKey = process.env.VITE_RESEND_API_KEY
      if (resendApiKey) {
        // Basic check - if API key exists, assume service is available
        // Could be enhanced with actual API ping if needed
        services.email = 'healthy'
      } else {
        services.email = 'unhealthy'
      }
    } catch (error) {
      console.error('Email service health check failed:', error)
      services.email = 'unhealthy'
    }

    return services
  }

  /**
   * Determine overall system status based on individual services
   */
  private static determineOverallStatus(services: HealthStatus['services']): HealthStatus['status'] {
    const { database, email } = services

    // Database is critical
    if (database === 'unhealthy') {
      return 'unhealthy'
    }

    // Email service issues cause degraded status
    if (email === 'unhealthy') {
      return 'degraded'
    }

    return 'healthy'
  }
}