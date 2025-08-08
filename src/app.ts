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

// Health check (enhanced public endpoint with dependency checks)
app.get('/health', async (req, res) => {
  try {
    const { HealthService } = await import('@/services/health.service.js')
    const healthStatus = await HealthService.getHealthStatus()
    
    // Add system metrics if there are concerns
    const systemMetrics = HealthService.getSystemMetrics()
    if (systemMetrics) {
      (healthStatus as any).metrics = systemMetrics
    }
    
    // Set appropriate HTTP status code
    const httpStatus = healthStatus.status === 'healthy' ? 200 :
                      healthStatus.status === 'degraded' ? 200 : 503
    
    res.status(httpStatus).json(healthStatus)
  } catch (error) {
    // If health check itself fails, return minimal response
    console.error('Health check error:', error)
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      message: 'Health check failed'
    })
  }
})

// Documentation routes (at root level)
app.use('/docs', docsRoutes)

// Internal API routes (for app backend)
app.use('/internal', routes)

// API root - public landing page
app.get('/', (req, res) => {
  res.json({
    name: "Vendorica API",
    version: "1.0.0",
    description: "Enterprise vendor risk management platform API",
    status: "operational",
    environment: process.env.NODE_ENV || "development",
    endpoints: {
      health: "/health",
      documentation: "/docs"
    },
    timestamp: new Date().toISOString()
  })
})

// 404 handler - Express 5.x compatible
app.use((req, res) => {
  sendNotFound(res, `Endpoint not found: ${req.method} ${req.originalUrl}`)
})

// Global error handler
app.use(errorHandler)

export default app