import dotenv from 'dotenv'

// Clean environment loading based on NODE_ENV
const environment = process.env.NODE_ENV || 'development'
console.log(`🔧 Loading ${environment} environment`)

// Load appropriate environment file
if (environment === 'production') {
  const result = dotenv.config({ path: '.env.production' })
  if (result.error) {
    console.error('❌ Error loading .env.production:', result.error.message)
  } else {
    console.log('✅ Production environment loaded')
  }
} else {
  const result = dotenv.config({ path: '.env.development' })
  if (result.error) {
    console.error('❌ Error loading .env.development:', result.error.message)
  } else {
    console.log('✅ Development environment loaded')
  }
}

// Early validation to catch configuration issues before app starts
try {
  const { validateEnvironment } = await import('./config/environment.js')
  validateEnvironment()
  // Only log success in production or if there were potential issues
  if (process.env.NODE_ENV === 'production') {
    console.log('✅ Environment validation passed')
  }
} catch (error) {
  console.error('\n💥 STARTUP FAILED - Environment Configuration Error:')
  
  // More robust error logging - avoid relying on error.message
  console.error('📋 Raw error object:', error)
  console.error('📋 Error type:', typeof error)
  console.error('📋 Error constructor:', error?.constructor?.name)
  if (error && typeof error === 'object') {
    console.error('📋 Error keys:', Object.keys(error))
  }
  
  // Enhanced debugging information for PM2 logs
  const { readFileSync, existsSync } = await import('fs')
  const { join } = await import('path')
  const nodeEnv = process.env.NODE_ENV || 'development'
  const expectedEnvFile = nodeEnv === 'production' ? '.env.production' : '.env.development'
  
  console.error('\n🔍 Detailed Environment Diagnostics:')
  console.error('📁 Current working directory:', process.cwd())
  console.error('🌍 NODE_ENV:', nodeEnv)
  console.error('📝 Expected .env file:', expectedEnvFile)
  
  // Check which .env files exist
  const possibleEnvFiles = ['.env', '.env.development', '.env.production', '.env.local']
  const existingEnvFiles = possibleEnvFiles.filter(file => {
    try {
      return existsSync(join(process.cwd(), file))
    } catch (e) {
      return false
    }
  })
  console.error('📂 Existing .env files:', existingEnvFiles.length > 0 ? existingEnvFiles.join(', ') : 'NONE FOUND')
  
  // Check critical environment variables
  const criticalVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'JWT_SECRET', 'FRONTEND_URL']
  console.error('🔑 Environment Variables Status:')
  criticalVars.forEach(varName => {
    const value = process.env[varName]
    console.error(`   ${varName}: ${value ? `✅ Set (${value.length} chars)` : '❌ Missing'}`)
  })
  
  // Restore the JWT_SECRET check
  console.error('🔍 JWT_SECRET loaded:', !!process.env.JWT_SECRET ? '✅ Yes' : '❌ No')
  
  // Show sample of all loaded environment variables (sanitized)
  const allEnvKeys = Object.keys(process.env)
    .filter(k => !k.toLowerCase().includes('secret') && !k.toLowerCase().includes('key') && !k.toLowerCase().includes('password'))
    .slice(0, 15)
  console.error('📊 Sample loaded env vars:', allEnvKeys.join(', '))
  
  console.error('\n🔧 Troubleshooting Tips:')
  console.error(`   1. Ensure ${expectedEnvFile} exists in: ${process.cwd()}`)
  console.error('   2. Check variable names match exactly (case-sensitive)')
  console.error('   3. For PM2: verify environment variables in ecosystem file')
  console.error('   4. For Docker: ensure ENV variables are properly mounted')
  
  process.exit(1)
}

// IMPORTANT: Import app AFTER environment loading and validation
import app from './app.js'

// Get port from environment (default 3000 for production/Cloudways compatibility)
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000

// Start server
const server = app.listen(PORT, () => {
  const startTime = new Date().toISOString()
  console.log(`\n${'='.repeat(60)}`)
  console.log(`🚀 Vendorica API Server Started`)
  console.log(`📅 Timestamp: ${startTime}`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🔧 Port: ${PORT}`)
  console.log(`${'='.repeat(60)}`)
  console.log(`❤️  Health Check: http://localhost:${PORT}/health`)
  console.log(`📚 Documentation: http://localhost:${PORT}/docs`)
  console.log(`🔒 Internal API: http://localhost:${PORT}/internal/*`)
  console.log(`🚀 Public API (coming soon): http://localhost:${PORT}/v1/*`)
  if (process.env.NODE_ENV !== 'production') {
    console.log('⚡ Development mode enabled')
  }
  console.log(`${'='.repeat(60)}\n`)
})

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  console.log(`🛑 ${signal} received, shutting down gracefully`)
  server.close(() => {
    console.log('✅ Process terminated')
    process.exit(0)
  })
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

export default server