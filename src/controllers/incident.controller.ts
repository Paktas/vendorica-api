import { Request, Response, NextFunction } from 'express'
import { IncidentService } from '@services/incident.service.js'
import { sendSuccess, sendError, sendUnauthorized } from '@/utils/response.util.js'
import { CreateIncidentRequest, UpdateIncidentRequest } from '@/types/api.types.js'

interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
    organizationId: string
  }
}

export class IncidentController {
  /**
   * List all incidents for organization
   * GET /api/internal/incidents
   */
  static async listIncidents(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user?.organizationId) {
        return sendUnauthorized(res, 'Organization access required')
      }

      const result = await IncidentService.listIncidents(req.user.organizationId)

      if (!result.success) {
        return sendError(res, result.error, 400)
      }

      return sendSuccess(res, result.data, 'Incidents retrieved successfully')
    } catch (error) {
      console.error('List incidents controller error:', error)
      return sendError(res, 'Internal server error', 500)
    }
  }

  /**
   * Get specific incident
   * GET /api/internal/incidents/:id
   */
  static async getIncident(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params

      if (!req.user?.organizationId) {
        return sendUnauthorized(res, 'Organization access required')
      }

      const result = await IncidentService.getIncident(id, req.user.organizationId)

      if (!result.success) {
        return sendError(res, result.error, 404)
      }

      return sendSuccess(res, result.data, 'Incident retrieved successfully')
    } catch (error) {
      console.error('Get incident controller error:', error)
      return sendError(res, 'Internal server error', 500)
    }
  }

  /**
   * Create new incident
   * POST /api/internal/incidents
   */
  static async createIncident(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const incidentData: CreateIncidentRequest = req.body

      if (!req.user?.id || !req.user?.organizationId) {
        return sendUnauthorized(res, 'Authentication required')
      }

      if (!incidentData.title) {
        return sendError(res, 'Incident title is required', 400)
      }

      const result = await IncidentService.createIncident(
        incidentData,
        req.user.id,
        req.user.organizationId
      )

      if (!result.success) {
        return sendError(res, result.error, 400)
      }

      return res.status(201).json({
        success: true,
        data: result.data,
        message: result.message
      })
    } catch (error) {
      console.error('Create incident controller error:', error)
      return sendError(res, 'Internal server error', 500)
    }
  }

  /**
   * Update existing incident
   * PUT /api/internal/incidents/:id
   */
  static async updateIncident(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const updateData: UpdateIncidentRequest = req.body

      if (!req.user?.id || !req.user?.organizationId) {
        return sendUnauthorized(res, 'Authentication required')
      }

      const result = await IncidentService.updateIncident(
        id,
        updateData,
        req.user.id,
        req.user.organizationId
      )

      if (!result.success) {
        return sendError(res, result.error, 400)
      }

      return sendSuccess(res, result.data, result.message)
    } catch (error) {
      console.error('Update incident controller error:', error)
      return sendError(res, 'Internal server error', 500)
    }
  }

  /**
   * Delete incident
   * DELETE /api/internal/incidents/:id
   */
  static async deleteIncident(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params

      if (!req.user?.id || !req.user?.organizationId) {
        return sendUnauthorized(res, 'Authentication required')
      }

      const result = await IncidentService.deleteIncident(
        id,
        req.user.id,
        req.user.organizationId
      )

      if (!result.success) {
        return sendError(res, result.error, 400)
      }

      return sendSuccess(res, null, result.message)
    } catch (error) {
      console.error('Delete incident controller error:', error)
      return sendError(res, 'Internal server error', 500)
    }
  }

  /**
   * Get enriched incident data
   * GET /api/internal/incidents/:id/enriched
   */
  static async getEnrichedIncident(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params

      if (!req.user?.organizationId) {
        return sendUnauthorized(res, 'Organization access required')
      }

      const result = await IncidentService.getEnrichedIncident(id, req.user.organizationId)

      if (!result.success) {
        return sendError(res, result.error, 404)
      }

      return sendSuccess(res, result.data, 'Enriched incident data retrieved successfully')
    } catch (error) {
      console.error('Get enriched incident controller error:', error)
      return sendError(res, 'Internal server error', 500)
    }
  }
}