/**
 * Environment configuration
 * Centralizes all environment variable access with ES modules support
 */
export const config = {
  environment: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_ANON_KEY
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  email: {
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.EMAIL_FROM || 'noreply@vendorica.com'
  },
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : undefined,
    cors: {
      origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000']
    }
  },
  api: {
    internalPrefix: '/internal',
    publicPrefix: '/v1'
  },
  app: {
    name: 'Vendorica API',
    version: process.env.npm_package_version || '1.0.0'
  }
}

/**
 * Validate required environment variables with enhanced debugging
 */
export const validateEnvironment = (): void => {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'JWT_SECRET'
  ]

  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    const nodeEnv = process.env.NODE_ENV || 'development'
    const envFile = nodeEnv === 'production' ? '.env.production' : '.env.development'
    const loadedKeys = Object.keys(process.env).filter(k => 
      required.some(req => k.includes(req.split('_')[0]))
    )
    
    const errorMessage = [
      `❌ Missing required environment variables: ${missing.join(', ')}`,
      `🔍 Environment: ${nodeEnv}`,
      `📁 Expected file: ${envFile}`,
      `🔑 Loaded related keys: ${loadedKeys.length > 0 ? loadedKeys.join(', ') : 'none'}`,
      `💡 Tip: Check if dotenv loaded correctly and variables are spelled correctly`
    ].join('\n')
    
    throw new Error(errorMessage)
  }
}

/**
 * Check if running in development mode
 */
export const isDevelopment = (): boolean => {
  return config.environment === 'development'
}

/**
 * Check if running in production mode
 */
export const isProduction = (): boolean => {
  return config.environment === 'production'
}