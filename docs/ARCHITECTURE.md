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
├── .env.development        # Development environment
├── .env.production         # Production environment
├── ecosystem.config.js     # PM2 configuration
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite configuration
```

## Environment Configuration

### Development (.env.development)
```env
NODE_ENV=development
PORT=3010
DATABASE_URL=postgresql://localhost:5432/vendorica_dev
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
API_BASE_URL=http://localhost:3010
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Production (.env.production)
```env
NODE_ENV=production
# NO PORT - Web server handles routing
DATABASE_URL=postgresql://prod-db:5432/vendorica_prod
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_production_anon_key
API_BASE_URL=https://api.vendorica.com
CORS_ORIGINS=https://app.vendorica.com,https://vendorica.com
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

## Platform Agnostic Deployment

The architecture supports simple deployment on any platform:

1. **2-Command Deployment**: `npm run build` + `npm start`
2. **Environment-Based Configuration**: All settings from .env files
3. **Standard Node.js**: No platform-specific dependencies
4. **Flexible Web Server**: Works with Apache, Nginx, or any reverse proxy

This design balances modern development experience with production reliability while maintaining simplicity and platform independence.