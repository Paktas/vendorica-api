import { getSupabaseClient } from '@/config/database.js'
import { ApiResponse, CreateIncidentRequest, UpdateIncidentRequest, Incident } from '@/types/api.types.js'

export class IncidentService {
  /**
   * List all incidents for organization
   */
  static async listIncidents(organizationId: string): Promise<ApiResponse<Incident[]>> {
    try {
      const supabase = getSupabaseClient()

      const { data: incidents, error } = await supabase
        .from('incidents')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to fetch incidents:', error)
        return {
          success: false,
          error: 'Failed to fetch incidents'
        }
      }

      return {
        success: true,
        data: incidents || []
      }
    } catch (error) {
      console.error('List incidents error:', error)
      return {
        success: false,
        error: 'Internal server error'
      }
    }
  }

  /**
   * Get specific incident
   */
  static async getIncident(id: string, organizationId: string): Promise<ApiResponse<Incident>> {
    try {
      const supabase = getSupabaseClient()

      const { data: incident, error } = await supabase
        .from('incidents')
        .select('*')
        .eq('id', id)
        .eq('organization_id', organizationId)
        .single()

      if (error || !incident) {
        return {
          success: false,
          error: 'Incident not found'
        }
      }

      return {
        success: true,
        data: incident
      }
    } catch (error) {
      console.error('Get incident error:', error)
      return {
        success: false,
        error: 'Internal server error'
      }
    }
  }

  /**
   * Create new incident
   */
  static async createIncident(
    data: CreateIncidentRequest, 
    userId: string, 
    organizationId: string
  ): Promise<ApiResponse<Incident>> {
    try {
      const supabase = getSupabaseClient()

      const incidentData = {
        ...data,
        created_by: userId,
        organization_id: organizationId,
        status: 'open',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data: incident, error } = await supabase
        .from('incidents')
        .insert(incidentData)
        .select('*')
        .single()

      if (error || !incident) {
        console.error('Failed to create incident:', error)
        return {
          success: false,
          error: 'Failed to create incident'
        }
      }

      // Add audit log
      try {
        await supabase
          .from('audit_trail')
          .insert({
            user_id: userId,
            action: 'create',
            table_name: 'incidents',
            record_id: incident.id,
            changes: incidentData,
            timestamp: new Date().toISOString()
          })
      } catch (auditError) {
        console.error('⚠️ Audit logging failed (non-critical):', auditError)
      }

      return {
        success: true,
        data: incident,
        message: 'Incident created successfully'
      }
    } catch (error) {
      console.error('Create incident error:', error)
      return {
        success: false,
        error: 'Internal server error'
      }
    }
  }

  /**
   * Update existing incident
   */
  static async updateIncident(
    id: string,
    data: UpdateIncidentRequest,
    userId: string,
    organizationId: string
  ): Promise<ApiResponse<Incident>> {
    try {
      const supabase = getSupabaseClient()

      // First check if incident exists and belongs to organization
      const { data: existingIncident, error: checkError } = await supabase
        .from('incidents')
        .select('*')
        .eq('id', id)
        .eq('organization_id', organizationId)
        .single()

      if (checkError || !existingIncident) {
        return {
          success: false,
          error: 'Incident not found'
        }
      }

      const updateData = {
        ...data,
        updated_at: new Date().toISOString()
      }

      const { data: incident, error } = await supabase
        .from('incidents')
        .update(updateData)
        .eq('id', id)
        .eq('organization_id', organizationId)
        .select('*')
        .single()

      if (error || !incident) {
        console.error('Failed to update incident:', error)
        return {
          success: false,
          error: 'Failed to update incident'
        }
      }

      // Add audit log
      try {
        await supabase
          .from('audit_trail')
          .insert({
            user_id: userId,
            action: 'update',
            table_name: 'incidents',
            record_id: incident.id,
            changes: updateData,
            timestamp: new Date().toISOString()
          })
      } catch (auditError) {
        console.error('⚠️ Audit logging failed (non-critical):', auditError)
      }

      return {
        success: true,
        data: incident,
        message: 'Incident updated successfully'
      }
    } catch (error) {
      console.error('Update incident error:', error)
      return {
        success: false,
        error: 'Internal server error'
      }
    }
  }

  /**
   * Delete incident
   */
  static async deleteIncident(
    id: string,
    userId: string,
    organizationId: string
  ): Promise<ApiResponse> {
    try {
      const supabase = getSupabaseClient()

      // First check if incident exists and belongs to organization
      const { data: existingIncident, error: checkError } = await supabase
        .from('incidents')
        .select('*')
        .eq('id', id)
        .eq('organization_id', organizationId)
        .single()

      if (checkError || !existingIncident) {
        return {
          success: false,
          error: 'Incident not found'
        }
      }

      const { error } = await supabase
        .from('incidents')
        .delete()
        .eq('id', id)
        .eq('organization_id', organizationId)

      if (error) {
        console.error('Failed to delete incident:', error)
        return {
          success: false,
          error: 'Failed to delete incident'
        }
      }

      // Add audit log
      try {
        await supabase
          .from('audit_trail')
          .insert({
            user_id: userId,
            action: 'delete',
            table_name: 'incidents',
            record_id: id,
            changes: { deleted_incident: existingIncident },
            timestamp: new Date().toISOString()
          })
      } catch (auditError) {
        console.error('⚠️ Audit logging failed (non-critical):', auditError)
      }

      return {
        success: true,
        message: 'Incident deleted successfully'
      }
    } catch (error) {
      console.error('Delete incident error:', error)
      return {
        success: false,
        error: 'Internal server error'
      }
    }
  }

  /**
   * Get enriched incident data (simulates external system integration)
   */
  static async getEnrichedIncident(
    id: string,
    organizationId: string
  ): Promise<ApiResponse<any>> {
    try {
      const supabase = getSupabaseClient()

      const { data: incident, error } = await supabase
        .from('incidents')
        .select('*')
        .eq('id', id)
        .eq('organization_id', organizationId)
        .single()

      if (error || !incident) {
        return {
          success: false,
          error: 'Incident not found'
        }
      }

      // Simulate external system data enrichment
      const enrichedData = {
        ...incident,
        external_system_data: {
          compliance_status: Math.random() > 0.5 ? 'compliant' : 'non_compliant',
          risk_score: Math.floor(Math.random() * 100),
          regulatory_requirements: [
            'SOX Compliance',
            'GDPR Article 33',
            'PCI DSS 12.10'
          ],
          similar_incidents: Math.floor(Math.random() * 10),
          estimated_impact: `$${Math.floor(Math.random() * 100000)}`,
          external_references: [
            'https://example-compliance-system.com/incident/' + id,
            'https://risk-management.internal/case/' + id
          ]
        },
        enrichment_timestamp: new Date().toISOString()
      }

      return {
        success: true,
        data: enrichedData
      }
    } catch (error) {
      console.error('Get enriched incident error:', error)
      return {
        success: false,
        error: 'Internal server error'
      }
    }
  }
}