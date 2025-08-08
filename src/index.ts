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
  console.error(error.message)
  console.error('\n🔧 Please check your environment file and try again.')
  console.error('🔍 JWT_SECRET loaded:', !!process.env.JWT_SECRET ? '✅ Yes' : '❌ No')
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