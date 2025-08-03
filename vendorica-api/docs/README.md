# Vendorica API

Modern ES Modules-based Node.js API for the Vendorica vendor risk management platform.

## Quick Start

### Development
```bash
# Install dependencies
npm install

# Start development server with HMR
npm run dev

# API will be available at http://localhost:3010 (development only)
# API docs available at http://localhost:3010/docs
# Production: Custom domain with standard Apache ports (80/443)
```

### Production
```bash
# Build the application
npm run build

# Start production server
npm start
```

## Environment Configuration

**Security**: All environment files are ignored by git except `.env.example`

**Setup**:
```bash
# Copy environment templates
cp .env.example .env.development
cp .env.example .env.production

# Configure your actual values in the copied files
```

**Files**:
- `.env.example` - Template with required variables (tracked in git)
- `.env.development` - Development configuration (ignored by git)  
- `.env.production` - Production configuration (ignored by git)

## API Documentation

- **Live Docs**: Visit `/docs` when server is running
- **Architecture**: See `docs/ARCHITECTURE.md`
- **API Reference**: See `docs/API.md`
- **Deployment**: See `docs/DEPLOYMENT.md`

## Technology Stack

- **Runtime**: Node.js 18+ with ES Modules
- **Language**: TypeScript
- **Framework**: Express.js
- **Development**: Vite with HMR
- **Database**: Supabase/PostgreSQL
- **Documentation**: OpenAPI/Swagger