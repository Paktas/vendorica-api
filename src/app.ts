import express from 'express'
import cors from 'cors'
// import { config, isDevelopment } from '@/config/environment.js'
import routes from '@/routes/index.js'
import docsRoutes from '@/routes/docs/index.js'
// import { HealthController } from '@controllers/health.controller.js'
import { errorHandler } from '@middleware/error.middleware.js'
import { sendNotFound } from '@/utils/response.util.js'
import { requestIdMiddleware } from '@middleware/request-id.middleware.js'
import { loggingMiddleware } from '@middleware/logging.middleware.js'

const app = express()

// Request ID middleware (should be first)
app.use(requestIdMiddleware)

// Logging middleware (only in development)
if (process.env.NODE_ENV === 'development') {
  app.use(loggingMiddleware)
}

// Basic CORS Configuration
const corsOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000']
app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))

// Middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Health check (simple endpoint)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// Documentation routes (at root level)
app.use('/docs', docsRoutes)

// Internal API routes (for app backend)
app.use('/internal', routes)

// 404 handler - Express 5.x compatible
app.use((req, res) => {
  sendNotFound(res, `Endpoint not found: ${req.method} ${req.originalUrl}`)
})

// Global error handler
app.use(errorHandler)

export default app