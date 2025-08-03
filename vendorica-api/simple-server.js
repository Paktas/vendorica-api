/**
 * Simple Express server for testing API integration
 */
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json());

// Basic logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      service: 'vendorica-api'
    }
  });
});

// Test auth endpoints
app.post('/api/internal/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Simple test credentials
  if (email === 'test@vendorica.com' && password === 'password123') {
    res.json({
      success: true,
      data: {
        token: 'test-jwt-token-' + Date.now(),
        user: {
          id: 'test-user-id',
          email: email,
          first_name: 'Test',
          last_name: 'User',
          role_id: 'test-role-id',
          organization_id: 'test-org-id',
          status: 'active'
        }
      }
    });
  } else {
    res.status(400).json({
      success: false,
      error: 'Invalid credentials'
    });
  }
});

app.post('/api/internal/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

app.post('/api/internal/auth/register', (req, res) => {
  const { email, password, firstName, lastName } = req.body;
  
  res.status(201).json({
    success: true,
    data: {
      token: 'test-jwt-token-' + Date.now(),
      user: {
        id: 'new-user-id-' + Date.now(),
        email: email,
        first_name: firstName || 'New',
        last_name: lastName || 'User',
        role_id: 'test-role-id',
        organization_id: 'test-org-id',
        status: 'active'
      }
    }
  });
});

// Test incident endpoints
app.get('/api/internal/incidents', (req, res) => {
  const mockIncidents = [
    {
      id: 'incident-1',
      title: 'Test Incident 1',
      description: 'This is a test incident',
      priority: 'medium',
      status: 'open',
      vendor_id: null,
      assigned_to: null,
      due_date: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'test-user-id'
    },
    {
      id: 'incident-2',
      title: 'Test Incident 2',
      description: 'Another test incident',
      priority: 'high',
      status: 'in_progress',
      vendor_id: 'test-vendor-id',
      assigned_to: 'test-user-id',
      due_date: new Date(Date.now() + 86400000).toISOString(),
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'test-user-id'
    }
  ];
  
  res.json({
    success: true,
    data: mockIncidents
  });
});

app.post('/api/internal/incidents', (req, res) => {
  const { title, description, priority, vendor_id, assigned_to, due_date } = req.body;
  
  const newIncident = {
    id: 'incident-' + Date.now(),
    title,
    description: description || '',
    priority: priority || 'medium',
    status: 'open',
    vendor_id: vendor_id || null,
    assigned_to: assigned_to || null,
    due_date: due_date || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: 'test-user-id'
  };
  
  res.status(201).json({
    success: true,
    data: newIncident
  });
});

app.get('/api/internal/incidents/:id', (req, res) => {
  const { id } = req.params;
  
  const mockIncident = {
    id: id,
    title: `Test Incident ${id}`,
    description: 'This is a test incident',
    priority: 'medium',
    status: 'open',
    vendor_id: null,
    assigned_to: null,
    due_date: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: 'test-user-id'
  };
  
  res.json({
    success: true,
    data: mockIncident
  });
});

app.put('/api/internal/incidents/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const updatedIncident = {
    id: id,
    title: updates.title || `Updated Incident ${id}`,
    description: updates.description || 'Updated description',
    priority: updates.priority || 'medium',
    status: updates.status || 'open',
    vendor_id: updates.vendor_id || null,
    assigned_to: updates.assigned_to || null,
    due_date: updates.due_date || null,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    created_by: 'test-user-id'
  };
  
  res.json({
    success: true,
    data: updatedIncident
  });
});

app.delete('/api/internal/incidents/:id', (req, res) => {
  res.json({
    success: true,
    message: 'Incident deleted successfully'
  });
});

app.get('/api/internal/incidents/:id/enriched', (req, res) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    data: {
      incident_id: id,
      external_ticket_id: 'EXT-' + Date.now(),
      similar_incidents: 3,
      external_system_status: 'operational',
      vendor_notifications_sent: false,
      estimated_recovery_time: 240,
      affected_service_count: 2,
      customer_impact_score: 75,
      auto_generated_summary: 'This incident appears to be related to system performance issues.',
      recommended_actions: [
        'Check system logs for errors',
        'Monitor performance metrics',
        'Contact vendor if issue persists'
      ],
      external_references: [],
      timestamp: new Date().toISOString()
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Vendorica API Server running on port ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth endpoints available at /api/internal/auth/*`);
  console.log(`📄 Incident endpoints available at /api/internal/incidents/*`);
});