/**
 * OpenAPI/Swagger Configuration (ES Modules version)
 * Auto-generates API documentation from JSDoc comments
 */

export const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Vendorica Internal API',
    version: '1.0.0',
    description: `
      Internal API for Vendorica application.
      
      ## Authentication
      Most endpoints require JWT Bearer token authentication:
      \`Authorization: Bearer <jwt_token>\`
      
      Obtain JWT tokens via the \`/auth/login\` endpoint.
      Tokens expire after 7 days and can be refreshed using \`/auth/refresh\`.
      
      ## Response Format
      All responses follow this format:
      \`\`\`json
      {
        "success": true|false,
        "data": any,           // Present on success
        "error": "string",     // Present on failure
        "message": "string"    // Optional message
      }
      \`\`\`
      
      ## Base URL
      - Internal API: \`http://localhost:3010/internal\`
      - Public API (future): \`http://localhost:3010/v1\`
      - Production: \`https://api.vendorica.com/internal\`
    `,
    contact: {
      name: 'Vendorica Development Team',
      email: 'dev@vendorica.com'
    },
    license: {
      name: 'Private',
      url: 'https://vendorica.com/license'
    }
  },
  servers: [
    {
      url: '/internal',
      description: 'Current server - Internal API'
    },
    {
      url: 'http://localhost:3010/internal',
      description: 'Development server - Internal API'
    },
    {
      url: 'https://app.vendorica.com/internal',
      description: 'Production server - Internal API'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token obtained from /auth/login endpoint'
      }
    },
    schemas: {
      // Standard API response schemas
      ApiSuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'object', description: 'Response data' },
          message: { type: 'string', example: 'Operation successful' }
        },
        required: ['success']
      },
      ApiErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string', example: 'Operation failed' },
          code: { type: 'string', example: 'VALIDATION_ERROR' }
        },
        required: ['success', 'error']
      },
      
      // Authentication schemas
      LoginRequest: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email', example: 'user@example.com' },
          password: { type: 'string', minLength: 8, example: 'password123' }
        },
        required: ['email', 'password']
      },
      LoginResponse: {
        allOf: [
          { $ref: '#/components/schemas/ApiSuccessResponse' },
          {
            type: 'object',
            properties: {
              token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1dWlkIiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwib3JnYW5pemF0aW9uSWQiOiJ1dWlkIn0.signature' },
              user: { $ref: '#/components/schemas/User' }
            }
          }
        ]
      },
      RegisterRequest: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email', example: 'user@example.com' },
          password: { type: 'string', minLength: 8, example: 'password123' }
        },
        required: ['email', 'password']
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          first_name: { type: 'string' },
          last_name: { type: 'string' },
          role_id: { type: 'string', format: 'uuid' },
          organization_id: { type: 'string', format: 'uuid' },
          status: { type: 'string', enum: ['active', 'inactive', 'pending'] },
          organization: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' }
            }
          },
          role: {
            type: 'object', 
            properties: {
              name: { type: 'string' },
              display_name: { type: 'string' }
            }
          }
        }
      },
      
      // Incident schemas
      Incident: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string', example: 'Data breach detected' },
          description: { type: 'string', example: 'Unauthorized access to customer database' },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          status: { type: 'string', enum: ['open', 'in_progress', 'resolved', 'closed'] },
          vendor_id: { type: 'string', format: 'uuid', nullable: true },
          assigned_to: { type: 'string', format: 'uuid', nullable: true },
          due_date: { type: 'string', format: 'date', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
          created_by: { type: 'string', format: 'uuid' }
        }
      },
      CreateIncidentRequest: {
        type: 'object',
        properties: {
          title: { type: 'string', example: 'System outage' },
          description: { type: 'string', example: 'Email service is down' },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          vendor_id: { type: 'string', format: 'uuid', nullable: true },
          assigned_to: { type: 'string', format: 'uuid', nullable: true },
          due_date: { type: 'string', format: 'date', nullable: true }
        },
        required: ['title', 'priority']
      },
      UpdateIncidentRequest: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          status: { type: 'string', enum: ['open', 'in_progress', 'resolved', 'closed'] },
          vendor_id: { type: 'string', format: 'uuid', nullable: true },
          assigned_to: { type: 'string', format: 'uuid', nullable: true },
          due_date: { type: 'string', format: 'date', nullable: true }
        }
      },
      
      // Health check schemas  
      HealthStatus: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
          timestamp: { type: 'string', format: 'date-time' },
          version: { type: 'string', example: '1.0.0' },
          services: {
            type: 'object',
            properties: {
              database: { type: 'string', enum: ['healthy', 'unhealthy'] },
              email: { type: 'string', enum: ['healthy', 'unhealthy', 'unknown'] }
            }
          },
          uptime: { type: 'number', description: 'Uptime in seconds' }
        }
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ],
  paths: {
    '/health': {
      get: {
        summary: 'Simple health check',
        description: 'Basic health status endpoint for load balancer checks',
        tags: ['Health'],
        responses: {
          200: {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthStatus' }
              }
            }
          },
          503: {
            description: 'Service is unhealthy',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/internal/auth/login': {
      post: {
        summary: 'User login',
        description: 'Authenticate user with email and password',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginResponse' }
              }
            }
          },
          400: {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/internal/auth/logout': {
      post: {
        summary: 'User logout',
        description: 'Logout user and invalidate authentication token',
        tags: ['Authentication'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Logout successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' }
              }
            }
          }
        }
      }
    },
    '/internal/auth/register': {
      post: {
        summary: 'User registration',
        description: 'Register a new user account with organization and role assignment',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' }
            }
          }
        },
        responses: {
          201: {
            description: 'Registration successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginResponse' }
              }
            }
          },
          400: {
            description: 'Validation error or user already exists',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/internal/auth/invite': {
      post: {
        summary: 'Send user invitation',
        description: 'Send invitation email to new user',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  recipientEmail: { type: 'string', format: 'email', example: 'user@example.com' },
                  firstName: { type: 'string', example: 'John' },
                  lastName: { type: 'string', example: 'Doe' },
                  organizationName: { type: 'string', example: 'Acme Corp' },
                  inviterName: { type: 'string', example: 'Jane Smith' },
                  inviteUrl: { type: 'string', example: 'https://app.vendorica.com/accept-invite?token=abc123' }
                },
                required: ['recipientEmail', 'organizationName', 'inviterName', 'inviteUrl']
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Invitation sent successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' }
              }
            }
          },
          400: {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/internal/auth/me': {
      get: {
        summary: 'Get current user',
        description: 'Get current authenticated user information',
        tags: ['Authentication'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'User information retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiSuccessResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: { $ref: '#/components/schemas/User' }
                      }
                    }
                  ]
                }
              }
            }
          },
          401: {
            description: 'Unauthorized - invalid or expired token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/internal/auth/refresh': {
      post: {
        summary: 'Refresh JWT token',
        description: 'Generate a new JWT token using current valid token',
        tags: ['Authentication'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Token refreshed successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiSuccessResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          type: 'object',
                          properties: {
                            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1dWlkIiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwib3JnYW5pemF0aW9uSWQiOiJ1dWlkIn0.signature' },
                            tokenType: { type: 'string', example: 'Bearer' },
                            expiresAt: { type: 'string', format: 'date-time' },
                            user: {
                              type: 'object',
                              properties: {
                                id: { type: 'string' },
                                email: { type: 'string' },
                                organizationId: { type: 'string' }
                              }
                            }
                          }
                        }
                      }
                    }
                  ]
                }
              }
            }
          },
          401: {
            description: 'Unauthorized - invalid or expired token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/internal/auth/validate': {
      post: {
        summary: 'Validate JWT token',
        description: 'Verify if JWT token is valid and get token information',
        tags: ['Authentication'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Token is valid',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiSuccessResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          type: 'object',
                          properties: {
                            valid: { type: 'boolean', example: true },
                            user: {
                              type: 'object',
                              properties: {
                                id: { type: 'string' },
                                email: { type: 'string' },
                                organizationId: { type: 'string' }
                              }
                            },
                            issuedAt: { type: 'string', format: 'date-time' },
                            expiresAt: { type: 'string', format: 'date-time' }
                          }
                        }
                      }
                    }
                  ]
                }
              }
            }
          },
          401: {
            description: 'Unauthorized - invalid or expired token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/internal/incidents': {
      get: {
        summary: 'List incidents',
        description: 'Get all incidents for authenticated user\'s organization',
        tags: ['Incidents'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Incidents retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Incident' }
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Create incident',
        description: 'Create a new incident',
        tags: ['Incidents'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateIncidentRequest' }
            }
          }
        },
        responses: {
          201: {
            description: 'Incident created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Incident' }
              }
            }
          }
        }
      }
    },
    '/internal/incidents/{id}': {
      get: {
        summary: 'Get incident',
        description: 'Get specific incident by ID',
        tags: ['Incidents'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        responses: {
          200: {
            description: 'Incident retrieved successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Incident' }
              }
            }
          }
        }
      },
      put: {
        summary: 'Update incident',
        description: 'Update existing incident',
        tags: ['Incidents'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateIncidentRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Incident updated successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Incident' }
              }
            }
          }
        }
      },
      delete: {
        summary: 'Delete incident',
        description: 'Delete incident by ID',
        tags: ['Incidents'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        responses: {
          200: {
            description: 'Incident deleted successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' }
              }
            }
          }
        }
      }
    },
    '/internal/incidents/{id}/enriched': {
      get: {
        summary: 'Get enriched incident data',
        description: 'Get incident with additional external system data',
        tags: ['Incidents'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        responses: {
          200: {
            description: 'Enriched incident data retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    incident_id: { type: 'string' },
                    external_ticket_id: { type: 'string' },
                    similar_incidents: { type: 'number' },
                    external_system_status: { type: 'string' },
                    vendor_notifications_sent: { type: 'boolean' },
                    estimated_recovery_time: { type: 'number' },
                    affected_service_count: { type: 'number' },
                    customer_impact_score: { type: 'number' },
                    auto_generated_summary: { type: 'string' },
                    recommended_actions: { type: 'array', items: { type: 'string' } },
                    external_references: { type: 'array', items: { type: 'object' } },
                    timestamp: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

export const swaggerSpec = swaggerDefinition