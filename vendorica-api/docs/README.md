# Vendorica API

Modern ES Modules-based Node.js API for the Vendorica vendor risk management platform.

## Quick Start

### Development
```bash
# Install dependencies
npm install

# Start development server with HMR
npm run dev

# API will be available at http://localhost:3002
# API docs available at http://localhost:3002/api/docs
```

### Production
```bash
# Build the application
npm run build

# Start production server
npm start
```

## Environment Configuration

Copy and configure environment files:
- `.env.development` for local development
- `.env.production` for production deployment

## API Documentation

- **Live Docs**: Visit `/api/docs` when server is running
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