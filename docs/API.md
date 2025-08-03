# Vendorica API Reference

## API Architecture

Vendorica uses a clear separation between internal and public APIs:

- **Internal API** (`/internal/*`): Backend API for the Vendorica application
- **Public API** (`/v1/*`): Public-facing API for external developers (coming soon)

## Base URLs

### Internal API (App Backend)
- **Development**: `http://localhost:3010/internal` (custom port for dev)
- **Production**: `https://api.vendorica.com/internal` (standard Apache ports 80/443)

### Public API (Coming Soon)
- **Development**: `http://localhost:3010/v1` (custom port for dev)
- **Production**: `https://api.vendorica.com/v1` (standard Apache ports 80/443)

## Authentication

All API endpoints require JWT Bearer token authentication.

### Headers
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Getting JWT Tokens
1. **Login**: Obtain JWT tokens via `/internal/auth/login` endpoint
2. **Expiration**: Tokens expire after 7 days
3. **Refresh**: Use `/internal/auth/refresh` to get new tokens
4. **Validation**: Use `/internal/auth/validate` to check token validity

## Response Format

### Standard Success Response
All successful responses follow this format:

```json
{
  "success": true,
  "data": {}, // Optional: Response data
  "message": "Optional success message",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "requestId": "req_123abc" // Optional: For request tracking
}
```

## API Endpoints

### Health Check

#### GET /health
Returns API health status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

### Vendors

#### GET /internal/vendors
List all vendors for the authenticated user's organization.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search term

**Response:**
```json
{
  "vendors": [
    {
      "id": "uuid",
      "name": "Vendor Name",
      "website": "https://vendor.com",
      "contact_email": "contact@vendor.com",
      "risk_level": "medium",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

#### POST /internal/vendors
Create a new vendor.

**Request Body:**
```json
{
  "name": "Vendor Name",
  "website": "https://vendor.com",
  "contact_email": "contact@vendor.com",
  "description": "Vendor description"
}
```

#### GET /internal/vendors/:id
Get vendor details.

#### PUT /internal/vendors/:id
Update vendor information.

#### DELETE /internal/vendors/:id
Delete vendor.

### Contracts

#### GET /internal/contracts
List all contracts.

#### POST /internal/contracts
Create a new contract.

#### GET /internal/contracts/:id
Get contract details.

#### PUT /internal/contracts/:id
Update contract.

#### DELETE /internal/contracts/:id
Delete contract.

### Users

#### GET /internal/users/profile
Get current user profile.

#### PUT /internal/users/profile
Update user profile.

#### GET /internal/users
List organization users (admin only).

### Organizations

#### GET /internal/organizations/current
Get current organization details.

#### PUT /internal/organizations/current
Update organization settings.

### Audit Trail

#### GET /internal/audit
Get audit trail entries.

**Query Parameters:**
- `action` (optional): Filter by action type
- `entity_type` (optional): Filter by entity type
- `from_date` (optional): Start date filter
- `to_date` (optional): End date filter

### Frameworks

#### GET /internal/frameworks
List assessment frameworks.

#### POST /internal/frameworks
Create new framework.

#### GET /internal/frameworks/:id/fields
Get framework fields.

#### POST /internal/frameworks/:id/fields
Add framework field.

## Error Responses

### Standard Error Format
All error responses follow this consistent format:

```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {}, // Optional: Additional error details
  "timestamp": "2024-01-01T00:00:00.000Z",
  "requestId": "req_123abc" // Optional: For request tracking
}
```

### Error Codes
- `BAD_REQUEST` - Invalid request format or parameters
- `UNAUTHORIZED` - Authentication required or failed
- `FORBIDDEN` - Authenticated but not authorized
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource already exists or state conflict
- `VALIDATION_ERROR` - Request validation failed
- `TOO_MANY_REQUESTS` - Rate limit exceeded
- `INTERNAL_ERROR` - Server error
- `SERVICE_UNAVAILABLE` - Service temporarily unavailable

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `429` - Too Many Requests
- `500` - Internal Server Error
- `503` - Service Unavailable

### Example Error Responses

#### Authentication Error
```json
{
  "success": false,
  "error": "Authorization token required",
  "code": "UNAUTHORIZED",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Validation Error
```json
{
  "success": false,
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "name": "Name is required",
    "email": "Invalid email format"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Not Found Error
```json
{
  "success": false,
  "error": "Vendor not found",
  "code": "NOT_FOUND",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Rate Limiting

- **Development**: No rate limiting
- **Production**: 100 requests per minute per IP

## Interactive Documentation

When the API server is running, visit `/docs` for interactive API documentation powered by Scalar.

## SDK Usage

For TypeScript/JavaScript applications, use the generated API client:

```typescript
import { ApiClient } from '@vendorica/api-client'

const client = new ApiClient({
  baseUrl: 'http://localhost:3010', // Development only
  // Production: 'https://api.vendorica.com' (standard ports)
  token: 'your-supabase-jwt-token'
})

// List vendors
const vendors = await client.vendors.list()

// Create vendor
const newVendor = await client.vendors.create({
  name: 'New Vendor',
  website: 'https://newvendor.com'
})
```