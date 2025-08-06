import dotenv from 'dotenv'

// Load environment variables based on NODE_ENV
// PM2 sets NODE_ENV before this runs, so we can use it to determine which env file to load
// Note: dotenv won't override existing env vars unless we use override: true
if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: '.env.production', override: true })
  console.log('🔧 Loaded production environment from .env.production')
} else {
  dotenv.config({ path: '.env.development' })
  console.log('🔧 Loaded development environment from .env.development')
}

// import { config, validateEnvironment, isDevelopment } from '@/config/environment.js'
import app from './app.js'

// Get port from environment (default 3000 for production/Cloudways compatibility)
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Vendorica API running on port ${PORT}`)
  console.log(`❤️  Health Check: http://localhost:${PORT}/health`)
  console.log(`📚 Documentation: http://localhost:${PORT}/docs`)
  console.log(`🔒 Internal API: http://localhost:${PORT}/internal/*`)
  console.log(`🚀 Public API (coming soon): http://localhost:${PORT}/v1/*`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
  if (process.env.NODE_ENV !== 'production') {
    console.log('⚡ Development mode enabled')
  }
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