/**
 * Common API response types
 */
export interface ApiSuccessResponse<T = any> {
  success: true
  data?: T
  message?: string
  token?: string
  user?: any
}

export interface ApiErrorResponse {
  success: false
  error: string
  code?: string
  details?: any
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse

/**
 * Authentication types
 */
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
}

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role_id: string
  organization_id: string
  status: string
  role?: {
    name: string
    display_name: string
  }
  organization?: {
    id: string
    name: string
  }
}

/**
 * Email types (internal service use only)
 */
export interface EmailNotification {
  to: string
  subject: string
  template: string
  templateData: Record<string, any>
  category?: string
}

/**
 * Incident types
 */
export interface CreateIncidentRequest {
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  vendor_id?: string
  assigned_to?: string
  due_date?: string
}

export interface UpdateIncidentRequest {
  title?: string
  description?: string
  priority?: 'low' | 'medium' | 'high' | 'critical'
  status?: 'open' | 'in_progress' | 'resolved' | 'closed'
  vendor_id?: string
  assigned_to?: string
  due_date?: string
}

export interface Incident {
  id: string
  title: string
  description?: string
  priority: string
  status: string
  vendor_id?: string
  assigned_to?: string
  due_date?: string
  created_at: string
  updated_at: string
  created_by: string
}