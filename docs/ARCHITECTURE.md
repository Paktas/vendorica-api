# Vendorica API Architecture

## Overview

Modern ES Modules-based Node.js API backend for the Vendorica vendor risk management platform. This architecture provides different approaches for development and production environments while maintaining simplicity and performance.

## Architecture Decisions

### 1. Module System: 100% ES Modules
- **Decision**: Pure ES Modules, no CommonJS
- **Rationale**: Modern standard, better tree-shaking, native Node.js support
- **Implementation**: `"type": "module"` in package.json

### 2. Development Environment: Vite + HMR
- **Technology**: Vite with vite-node for development
- **Features**: Hot Module Replacement (HMR) for rapid development
- **Port**: 3010 (development only - from .env.development)
- **Command**: `npm run dev`

### 3. Production Environment: Compiled JavaScript
- **Technology**: Node.js native with compiled JS
- **Process Manager**: PM2 with cluster mode
- **Port**: None (Apache reverse proxy handles routing)
- **Commands**: `npm run build` → `npm start`

### 4. Configuration Strategy
- **Environment Files**: All configuration from .env files only
- **Port Handling**: 
  - Development: PORT=3010 in .env.development (custom port for local dev)
  - Production: No PORT variable (Apache reverse proxy on standard ports 80/443)
  - Fallback: Framework defaults if PORT missing

### 5. Path Aliases
Clean imports using TypeScript path mapping:
```typescript
import { config } from '@/config/environment.js'
import { UserController } from '@controllers/user.js'
import { AuthService } from '@services/auth.js'
```

### 6. API Documentation Strategy
- **Technology**: Scalar API Reference (OpenAPI 3.0)
- **Dynamic Server URLs**: Automatically detects current server (no hardcoded values)
- **Universal**: Works with any documentation tool (Scalar, SwaggerUI, etc.)
- **Environment Agnostic**: Same configuration works in dev/staging/prod
- **Security**: JWT Bearer token authentication integrated

### 7. API Architecture Design
- **Internal API** (`/internal/*`): Backend for Vendorica application
- **Public API** (`/v1/*`): Future public-facing API for external developers
- **Health Endpoints**: Simple monitoring and status checks
- **Documentation Routes**: Interactive API documentation at `/docs`
- **Separation of Concerns**: Clear distinction between internal and public APIs

## Directory Structure

```
vendorica-api/
├── docs/                     # Documentation
│   ├── ARCHITECTURE.md      # This file
│   ├── API.md              # API endpoints documentation
│   ├── DEPLOYMENT.md       # Production deployment guide
│   └── README.md           # Quick start guide
├── src/
│   ├── config/             # Configuration and environment
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Express middleware
│   ├── routes/             # Route definitions
│   ├── services/           # Business logic
│   ├── types/              # TypeScript type definitions
│   └── index.ts            # Application entry point
├── dist/                   # Compiled JavaScript (production)
├── logs/                   # PM2 log files
├── .env.development        # Development environment (IGNORED by git)
├── .env.production         # Production environment (IGNORED by git)
├── .env.example            # Environment template (tracked)
├── ecosystem.config.js     # PM2 configuration
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite configuration
└── .github/
    └── workflows/
        └── deploy-production.yml # CI/CD pipeline
```

## Environment Configuration

### Environment Files (.env.*)

**Security**: All `.env.*` files are ignored by git except `.env.example`

**Setup Process**:
1. Copy `.env.example` to `.env.development` and `.env.production`
2. Fill in actual values for your environment
3. Never commit actual environment files

**Development (.env.development)**:
```env
NODE_ENV=development
PORT=3010
DATABASE_URL=postgresql://localhost:5432/vendorica_dev
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
API_BASE_URL=http://localhost:3010
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
JWT_SECRET=your-development-jwt-secret
```

**Production (.env.production)**:
```env
NODE_ENV=production
# NO PORT - Web server handles routing
DATABASE_URL=postgresql://prod-db:5432/vendorica_prod
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_production_anon_key
API_BASE_URL=https://api.vendorica.com
CORS_ORIGINS=https://app.vendorica.com,https://vendorica.com
JWT_SECRET=your-production-jwt-secret
```

## Development Workflow

### Local Development
1. `npm install` - Install dependencies
2. `npm run dev` - Start development server with HMR
3. API available at http://localhost:3010 (development only)
4. Changes automatically reload via Vite HMR

### Production Deployment
1. `npm run build` - Compile TypeScript to JavaScript
2. `npm start` - Start production server via PM2
3. Apache reverse proxy routes to Node.js application

## Technology Stack

### Core Technologies
- **Runtime**: Node.js 18+ (native ES Modules support)
- **Language**: TypeScript (compiled to ES2022)
- **Framework**: Express.js
- **Database**: Supabase/PostgreSQL

### Development Tools
- **Dev Server**: Vite with vite-node
- **Hot Reload**: Vite HMR
- **Type Checking**: TypeScript compiler

### Production Tools
- **Process Manager**: PM2 (cluster mode, 2 instances)
- **Web Server**: Apache (reverse proxy)
- **Monitoring**: PM2 built-in monitoring

### Documentation Tools
- **API Reference**: Scalar (OpenAPI 3.0 compliant)
- **Interactive Testing**: Built-in API testing interface
- **Auto-generation**: Spec generated from JSDoc comments
- **Dynamic URLs**: Server detection without hardcoded values

## Pros and Cons

### Development Environment (Vite + HMR)

**Pros:**
- ⚡ Instant hot reloading for rapid development
- 🔄 Unified development experience with frontend
- 🎯 No build step required during development
- 🚀 Fast startup times
- 🔧 Excellent debugging experience

**Cons:**
- 📦 Additional development dependency (Vite)
- 🔄 Different runtime between dev and prod

### Production Environment (Compiled JS + PM2)

**Pros:**
- 🏃‍♂️ Maximum runtime performance
- 📦 No build-time dependencies in production
- 🔄 Process clustering for scalability
- 💾 Lower memory usage
- 🛡️ Battle-tested PM2 process management

**Cons:**
- 🔨 Build step required for deployment
- 🐛 Less debugging flexibility than development

### ES Modules Only

**Pros:**
- 🆕 Modern JavaScript standard
- 🌳 Better tree-shaking and optimization
- 🔄 Native Node.js support (no transpilation)
- 📦 Smaller bundle sizes
- 🎯 Future-proof architecture

**Cons:**
- 📚 Some older packages may need adaptation
- 🔄 Learning curve for CommonJS developers

## Implementation Notes

### Import Extensions
ES Modules require explicit file extensions in imports:
```typescript
// Correct
import { config } from './config/environment.js'

// Incorrect (will fail at runtime)
import { config } from './config/environment'
```

### Path Aliases in Production
TypeScript path aliases are resolved during build time by Vite, ensuring clean imports work in both development and production.

### Port Configuration
- Development: Explicit PORT=3010 for predictable local development (custom port)
- Production: No port specified, Apache handles all routing
- Fallback: Framework defaults if environment variable missing

### Process Management
- Development: Single process with HMR
- Production: PM2 cluster mode with 2 instances for load distribution

### Security Architecture
- **JWT Authentication**: Secure token-based authentication (replaced insecure base64)
- **Token Management**: 7-day expiration with refresh capabilities
- **Standardized Errors**: Consistent error responses with request tracking
- **Environment Security**: All environment files ignored by git (only .env.example tracked)
- **Request Tracking**: Request IDs for debugging and audit trails

## Deployment

For detailed deployment instructions, see [`docs/DEPLOYMENT.md`](./DEPLOYMENT.md).

The architecture supports various deployment platforms including managed hosting (Cloudways), cloud platforms (AWS, GCP), containers (Docker), and serverless environments.

This design balances modern development experience with production reliability while maintaining simplicity and platform independence.

## Recent Architectural Improvements

### Security Enhancements
- **JWT Authentication System**: Replaced insecure base64 tokens with proper JWT implementation
- **Environment Security**: All `.env.*` files excluded from git (only `.env.example` tracked)
- **Standardized Error Handling**: Consistent error responses with request tracking and timestamps
- **Request ID Middleware**: Unique request identifiers for debugging and audit trails

### Documentation Architecture
- **Dynamic Server Detection**: API documentation automatically adapts to current environment
- **Universal Tool Support**: Configuration works with any OpenAPI-compatible tool
- **Zero Hardcoded Values**: No maintenance needed for different environments or ports
- **Interactive Testing**: Built-in API testing directly from documentation interface

### API Design Patterns
- **Clear Route Separation**: `/internal/*` for app backend, `/v1/*` for future public API
- **Consistent Response Format**: Standardized success/error response structures
- **Comprehensive OpenAPI Spec**: Fully documented endpoints with examples and schemas
- **Production-Ready**: Battle-tested patterns for scalability and maintainability

### Deployment Architecture
- **Cloudways Integration**: Optimized for managed hosting with automatic configuration
- **GitHub Actions CI/CD**: Automated deployments with testing and verification
- **Zero-Configuration Apache**: Web server automatically configured by Cloudways
- **PM2 Clustering**: Process management with load balancing (requires installation)
- **SSL/Security**: Automatic certificate management and security headers