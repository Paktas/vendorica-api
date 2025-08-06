import dotenv from 'dotenv'

// Debug environment loading
console.log('\n🔍 Environment Loading Debug:')
console.log(`- Initial NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`)
console.log(`- Current working directory: ${process.cwd()}`)

// Load environment variables based on NODE_ENV
// PM2 sets NODE_ENV before this runs, so we can use it to determine which env file to load
// Note: dotenv won't override existing env vars unless we use override: true
if (process.env.NODE_ENV === 'production') {
  const result = dotenv.config({ path: '.env.production', override: true })
  if (result.error) {
    console.error('❌ Error loading .env.production:', result.error.message)
  } else {
    console.log('✅ Loaded production environment from .env.production')
    console.log(`- NODE_ENV after loading: ${process.env.NODE_ENV}`)
  }
} else {
  const result = dotenv.config({ path: '.env.development' })
  if (result.error) {
    console.error('❌ Error loading .env.development:', result.error.message)
  } else {
    console.log('✅ Loaded development environment from .env.development') 
    console.log(`- NODE_ENV after loading: ${process.env.NODE_ENV || 'still undefined'}`)
  }
}

// import { config, validateEnvironment, isDevelopment } from '@/config/environment.js'
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