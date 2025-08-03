import { Resend } from 'resend'
import Handlebars from 'handlebars'
import { readFileSync } from 'fs'
import { join } from 'path'
import { ApiResponse } from '@/types/api.types.js'

export class EmailService {
  private static resend: Resend | null = null

  /**
   * Get or create Resend client
   */
  private static getResendClient(): Resend {
    if (!this.resend) {
      const apiKey = process.env.VITE_RESEND_API_KEY
      if (!apiKey) {
        throw new Error('VITE_RESEND_API_KEY environment variable is required')
      }
      this.resend = new Resend(apiKey)
    }
    return this.resend
  }

  /**
   * Load and compile Handlebars email template
   */
  private static loadTemplate(templateName: string): HandlebarsTemplateDelegate {
    try {
      const templatePath = join(process.cwd(), 'src/server/services/email/templates', `${templateName}.handlebars`)
      const templateContent = readFileSync(templatePath, 'utf-8')
      return Handlebars.compile(templateContent)
    } catch (error) {
      console.error(`Failed to load template ${templateName}:`, error)
      throw new Error(`Email template ${templateName} not found`)
    }
  }

  /**
   * Send user invitation email
   */
  static async sendUserInvitation(data: {
    to: string
    inviterName: string
    organizationName: string
    inviteUrl: string
    recipientName?: string
  }): Promise<ApiResponse> {
    try {
      const resend = this.getResendClient()

      // Prepare template data
      const templateData = {
        recipientName: data.recipientName || 'New User',
        inviterName: data.inviterName,
        organizationName: data.organizationName,
        inviteUrl: data.inviteUrl,
        supportEmail: 'support@vendorica.com',
        appName: 'Vendorica',
        currentYear: new Date().getFullYear()
      }

      // Load and compile template
      const template = this.loadTemplate('user-invitation')
      const htmlContent = template(templateData)

      // Send email
      const response = await resend.emails.send({
        from: 'Vendorica <noreply@vendorica.com>',
        to: data.to,
        subject: `You've been invited to join ${data.organizationName} on Vendorica`,
        html: htmlContent,
        tags: [
          { name: 'category', value: 'user-invitation' },
          { name: 'environment', value: process.env.NODE_ENV || 'development' }
        ]
      })

      if (response.error) {
        console.error('Failed to send invitation email:', response.error)
        return {
          success: false,
          error: 'Failed to send invitation email'
        }
      }

      return {
        success: true,
        data: { emailId: response.data?.id },
        message: 'Invitation email sent successfully'
      }
    } catch (error) {
      console.error('Send invitation email error:', error)
      return {
        success: false,
        error: 'Failed to send invitation email'
      }
    }
  }

  /**
   * Send password reset email
   */
  static async sendPasswordReset(data: {
    to: string
    firstName: string
    lastName: string
    resetUrl: string
    organizationName?: string
  }): Promise<ApiResponse> {
    try {
      const resend = this.getResendClient()

      // Prepare template data
      const templateData = {
        recipientName: `${data.firstName} ${data.lastName}`.trim(),
        recipientEmail: data.to,
        organizationName: data.organizationName || 'Vendorica',
        resetUrl: data.resetUrl,
        expiryTime: '1 hour',
        currentYear: new Date().getFullYear()
      }

      // Load and compile template
      const template = this.loadTemplate('password-reset')
      const htmlContent = template(templateData)

      // Send email
      const response = await resend.emails.send({
        from: 'Vendorica <noreply@vendorica.com>',
        to: data.to,
        subject: `Password Reset Request - ${data.organizationName || 'Vendorica'}`,
        html: htmlContent,
        tags: [
          { name: 'category', value: 'password-reset' },
          { name: 'environment', value: process.env.NODE_ENV || 'development' }
        ]
      })

      if (response.error) {
        console.error('Failed to send password reset email:', response.error)
        return {
          success: false,
          error: 'Failed to send password reset email'
        }
      }

      return {
        success: true,
        data: { emailId: response.data?.id },
        message: 'Password reset email sent successfully'
      }
    } catch (error) {
      console.error('Send password reset email error:', error)
      return {
        success: false,
        error: 'Failed to send password reset email'
      }
    }
  }

  /**
   * Send notification email (internal use by other services)
   */
  static async sendNotification(data: {
    to: string
    subject: string
    template: string
    templateData: Record<string, any>
    category?: string
  }): Promise<ApiResponse> {
    try {
      const resend = this.getResendClient()

      // Load and compile template
      const template = this.loadTemplate(data.template)
      const htmlContent = template(data.templateData)

      // Send email
      const response = await resend.emails.send({
        from: 'Vendorica <noreply@vendorica.com>',
        to: data.to,
        subject: data.subject,
        html: htmlContent,
        tags: [
          { name: 'category', value: data.category || 'notification' },
          { name: 'environment', value: process.env.NODE_ENV || 'development' }
        ]
      })

      if (response.error) {
        console.error('Failed to send notification email:', response.error)
        return {
          success: false,
          error: 'Failed to send notification email'
        }
      }

      return {
        success: true,
        data: { emailId: response.data?.id },
        message: 'Notification email sent successfully'
      }
    } catch (error) {
      console.error('Send notification email error:', error)
      return {
        success: false,
        error: 'Failed to send notification email'
      }
    }
  }
}