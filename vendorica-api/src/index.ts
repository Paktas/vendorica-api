import dotenv from 'dotenv'

// Load environment variables FIRST
dotenv.config({ path: '.env.development' })

// import { config, validateEnvironment, isDevelopment } from '@/config/environment.js'
import app from './app.js'

// Get port from environment
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3010

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Vendorica API running on port ${PORT}`)
  console.log(`❤️  Health Check: http://localhost:${PORT}/health`)
  console.log(`📚 Documentation: http://localhost:${PORT}/docs`)
  console.log(`🔒 Internal API: http://localhost:${PORT}/internal/*`)
  console.log(`🚀 Public API (coming soon): http://localhost:${PORT}/v1/*`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log('⚡ Development mode enabled')
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