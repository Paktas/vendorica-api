import { getSupabaseClient } from '@/config/database.js'
import os from 'os'

/**
 * Health check service with security-conscious public endpoint
 * Provides useful operational data without exposing sensitive information
 */

interface ServiceCheck {
  name: string
  status: 'operational' | 'degraded' | 'down'
  responseTimeMs?: number
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  uptime: string
  services: {
    api: 'operational' | 'degraded' | 'down'
    database: 'operational' | 'degraded' | 'down'
    email: 'operational' | 'degraded' | 'down'
  }
  response_times?: {
    database?: string
  }
  version: string
  environment: 'production' | 'development' | 'staging'
  config?: {
    missing_env_vars?: string[]
    loaded_env_file?: string
  }
}

export class HealthService {
  private static startTime = Date.now()
  private static readonly SLOW_RESPONSE_THRESHOLD_MS = 1000
  private static readonly CRITICAL_RESPONSE_THRESHOLD_MS = 5000

  /**
   * Get public health status with security considerations
   * Returns operational status without exposing internal details
   */
  static async getHealthStatus(): Promise<HealthStatus> {
    const checks: ServiceCheck[] = []
    
    // Check database connectivity with timeout
    const dbCheck = await this.checkDatabase()
    checks.push(dbCheck)
    
    // Check email service availability
    const emailCheck = await this.checkEmailService()
    checks.push(emailCheck)
    
    // Determine overall status
    const overallStatus = this.determineOverallStatus(checks)
    
    // Calculate uptime in human-readable format
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000)
    const uptime = this.formatUptime(uptimeSeconds)
    
    // Build response with security in mind
    const response: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime,
      services: {
        api: 'operational',
        database: dbCheck.status,
        email: emailCheck.status
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: (process.env.NODE_ENV || 'development') as any
    }

    // Add configuration diagnostics in development
    if (process.env.NODE_ENV === 'development') {
      const configCheck = this.checkEnvironmentConfig()
      if (configCheck.missing_env_vars.length > 0 || configCheck.loaded_env_file) {
        response.config = configCheck
      }
    }
    
    // Only include response times if they're concerning (helps with debugging)
    if (dbCheck.responseTimeMs && dbCheck.responseTimeMs > this.SLOW_RESPONSE_THRESHOLD_MS) {
      response.response_times = {
        database: `${dbCheck.responseTimeMs}ms`
      }
    }
    
    return response
  }

  /**
   * Check database connectivity with timeout
   * Returns generic status without exposing connection details
   */
  private static async checkDatabase(): Promise<ServiceCheck> {
    const startTime = Date.now()
    
    try {
      const supabase = getSupabaseClient()
      
      // Set a timeout for the database check
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database check timeout')), 5000)
      )
      
      // Simple connectivity check - just verify we can reach the database
      const checkPromise = supabase
        .from('organizations')
        .select('id')
        .limit(1)
        .single()
      
      await Promise.race([checkPromise, timeoutPromise])
      
      const responseTime = Date.now() - startTime
      
      // Determine status based on response time
      let status: ServiceCheck['status'] = 'operational'
      if (responseTime > this.CRITICAL_RESPONSE_THRESHOLD_MS) {
        status = 'degraded'
      }
      
      return {
        name: 'database',
        status,
        responseTimeMs: responseTime
      }
    } catch (error) {
      // Log internally but don't expose error details
      console.error('Database health check failed:', error)
      
      return {
        name: 'database',
        status: 'down',
        responseTimeMs: Date.now() - startTime
      }
    }
  }

  /**
   * Check email service availability
   * Only verifies configuration, doesn't make actual API calls
   */
  private static async checkEmailService(): Promise<ServiceCheck> {
    try {
      // Check if email service is configured
      const isConfigured = !!(
        process.env.RESEND_API_KEY && 
        process.env.EMAIL_FROM
      )
      
      if (!isConfigured) {
        return {
          name: 'email',
          status: 'down'
        }
      }
      
      // Validate API key format (basic check without making API call)
      const apiKey = process.env.RESEND_API_KEY
      const isValidFormat = apiKey && apiKey.startsWith('re_') && apiKey.length > 10
      
      return {
        name: 'email',
        status: isValidFormat ? 'operational' : 'degraded'
      }
    } catch (error) {
      console.error('Email service health check failed:', error)
      return {
        name: 'email',
        status: 'down'
      }
    }
  }

  /**
   * Determine overall system status based on individual service checks
   */
  private static determineOverallStatus(checks: ServiceCheck[]): HealthStatus['status'] {
    const hasDownService = checks.some(check => check.status === 'down')
    const hasDegradedService = checks.some(check => check.status === 'degraded')
    
    // If database is down, system is unhealthy
    const databaseCheck = checks.find(c => c.name === 'database')
    if (databaseCheck?.status === 'down') {
      return 'unhealthy'
    }
    
    // If any critical service is down, system is unhealthy
    if (hasDownService) {
      return 'degraded'
    }
    
    // If services are degraded, system is degraded
    if (hasDegradedService) {
      return 'degraded'
    }
    
    return 'healthy'
  }

  /**
   * Format uptime in human-readable format
   */
  private static formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    const parts = []
    if (days > 0) parts.push(`${days}d`)
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0) parts.push(`${minutes}m`)
    
    // If uptime is less than a minute, just show seconds
    if (parts.length === 0) {
      parts.push(`${seconds}s`)
    }
    
    return parts.join(' ')
  }

  /**
   * Get detailed environment diagnostics (development only)
   */
  static getEnvironmentDiagnostics() {
    if (process.env.NODE_ENV !== 'development') {
      return { error: 'Environment diagnostics only available in development mode' }
    }

    const requiredEnvVars = [
      'DATABASE_URL',
      'JWT_SECRET', 
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'RESEND_API_KEY',
      'EMAIL_FROM'
    ]

    const diagnostics = {
      environment: process.env.NODE_ENV || 'development',
      loaded_env_file: this.getLoadedEnvFile(),
      required_variables: {},
      jwt_service_test: this.testJWTService(),
      dotenv_timing: this.checkDotenvTiming()
    }

    // Check each required variable with details
    requiredEnvVars.forEach(varName => {
      const value = process.env[varName]
      diagnostics.required_variables[varName] = {
        present: !!value,
        length: value ? value.length : 0,
        starts_with: value ? value.substring(0, 10) + '...' : null,
        type: typeof value
      }
    })

    return diagnostics
  }

  private static testJWTService() {
    try {
      // Test if JWT_SECRET is accessible at runtime
      const secret = process.env.JWT_SECRET
      return {
        secret_accessible: !!secret,
        secret_length: secret ? secret.length : 0,
        test_result: 'accessible'
      }
    } catch (error) {
      return {
        secret_accessible: false,
        error: error.message,
        test_result: 'failed'
      }
    }
  }

  private static checkDotenvTiming() {
    // Check if environment variables were loaded properly
    const nodeEnv = process.env.NODE_ENV || 'development'
    const expectedFile = nodeEnv === 'production' ? '.env.production' : '.env.development'
    
    return {
      node_env: nodeEnv,
      expected_file: expectedFile,
      dotenv_loaded: !!process.env.JWT_SECRET, // Use JWT_SECRET as canary
      process_env_count: Object.keys(process.env).length
    }
  }

  private static getLoadedEnvFile() {
    const nodeEnv = process.env.NODE_ENV || 'development'
    if (nodeEnv === 'production') {
      return '.env.production'
    } else if (nodeEnv === 'development') {
      return '.env.development'
    } else {
      return `.env.${nodeEnv}`
    }
  }

  /**
   * Check environment configuration (development only)
   */
  private static checkEnvironmentConfig() {
    const requiredEnvVars = [
      'DATABASE_URL',
      'JWT_SECRET', 
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'RESEND_API_KEY',
      'EMAIL_FROM'
    ]

    const missing_env_vars = requiredEnvVars.filter(envVar => !process.env[envVar])
    
    // Try to determine which env file was loaded
    let loaded_env_file = 'unknown'
    const nodeEnv = process.env.NODE_ENV || 'development'
    if (nodeEnv === 'production') {
      loaded_env_file = '.env.production'
    } else if (nodeEnv === 'development') {
      loaded_env_file = '.env.development'
    } else {
      loaded_env_file = `.env.${nodeEnv}`
    }

    return {
      missing_env_vars,
      loaded_env_file
    }
  }

  /**
   * Get system metrics (safe for public exposure)
   */
  static getSystemMetrics() {
    const totalMemory = os.totalmem()
    const freeMemory = os.freemem()
    const usedMemory = totalMemory - freeMemory
    const memoryUsagePercent = Math.round((usedMemory / totalMemory) * 100)
    
    // Only return concerning metrics
    const metrics: any = {}
    
    // Only include memory warning if usage is high
    if (memoryUsagePercent > 80) {
      metrics.memory_pressure = 'high'
    } else if (memoryUsagePercent > 60) {
      metrics.memory_pressure = 'moderate'
    }
    
    // Include load average (safe metric that indicates system load)
    const loadAverage = os.loadavg()
    const cpuCount = os.cpus().length
    const normalizedLoad = loadAverage[0] / cpuCount
    
    if (normalizedLoad > 0.8) {
      metrics.system_load = 'high'
    } else if (normalizedLoad > 0.6) {
      metrics.system_load = 'moderate'
    }
    
    return Object.keys(metrics).length > 0 ? metrics : undefined
  }
}