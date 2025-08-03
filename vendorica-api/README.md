# Vendorica API

Enterprise vendor risk management platform API backend.

## Features

- **Authentication**: JWT-based auth with password reset
- **Vendor Management**: Full CRUD operations for vendors
- **Incident Tracking**: Security incident management
- **User Management**: Role-based access control
- **Database Migrations**: Automated schema management
- **API Documentation**: Interactive Scalar docs

## Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Supabase account (optional)

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure your environment variables in .env

# Run database migrations
npm run migrate:up

# Start development server
npm run dev
```

### Development URLs (Port 3010)
- **API**: `http://localhost:3010`
- **Health Check**: `http://localhost:3010/health`
- **Documentation**: `http://localhost:3010/docs`
- **Internal API**: `http://localhost:3010/internal/*`

*Note: Port 3010 is used for development only. Production runs on custom domain with standard Apache port 80/443.*

## Production Setup

Production deployment uses Apache reverse proxy on standard ports (80/443):

```bash
# Build the application
npm run build

# Start production server (no custom port)
npm start
```

## API Architecture

Vendorica uses a clear separation between internal and public APIs:

- **Internal API** (`/internal/*`): Backend API for the Vendorica application
- **Public API** (`/v1/*`): Public-facing API for external developers (coming soon)

## API Endpoints

### Authentication  
- `POST /internal/auth/login` - User login
- `POST /internal/auth/register` - User registration
- `POST /internal/auth/logout` - User logout
- `POST /internal/auth/refresh` - Refresh JWT token
- `POST /internal/auth/validate` - Validate JWT token
- `GET /internal/auth/me` - Get current user info
- `POST /internal/auth/password/reset` - Password reset request
- `POST /internal/auth/password/confirm` - Confirm password reset

### Health
- `GET /health` - Simple health check (public)
- `GET /internal/health` - Detailed health status

### Incidents
- `GET /internal/incidents` - List incidents
- `POST /internal/incidents` - Create incident
- `GET /internal/incidents/:id` - Get incident details
- `PUT /internal/incidents/:id` - Update incident
- `DELETE /internal/incidents/:id` - Delete incident
- `GET /internal/incidents/:id/enriched` - Get enriched incident data

### Documentation
- `GET /docs` - Interactive API documentation powered by Scalar

## Database Migrations

```bash
# Run all pending migrations
npm run migrate:up

# Rollback last migration
npm run migrate:down

# Check migration status
npm run migrate:status
```

## Environment Variables

See `.env.example` for all required environment variables.

## Architecture

- **Express.js** - Web framework
- **TypeScript** - Type safety
- **PostgreSQL** - Primary database
- **Supabase** - Database hosting & auth (optional)
- **JWT** - Authentication tokens
- **Handlebars** - Email templates

## Deployment

Designed for deployment on:
- Cloudways
- Railway
- Heroku  
- DigitalOcean
- AWS/GCP

## License

MIT License - see LICENSE file for details.