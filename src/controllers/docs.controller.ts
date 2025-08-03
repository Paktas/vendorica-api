import { Request, Response } from 'express'
import { swaggerSpec } from '@/config/swagger.js'
import { sendInternalError } from '@/utils/response.util.js'

export class DocsController {
  /**
   * Serve Scalar API Reference interface
   */
  static async serveSwaggerUI(req: Request, res: Response) {
    try {
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vendorica Internal API Documentation</title>
  <style>
    body { margin: 0; padding: 0; font-family: Inter, system-ui, -apple-system, sans-serif; }
  </style>
</head>
<body>
  <script
    id="api-reference"
    data-url="/docs/spec.json"
    data-configuration='${JSON.stringify({
      theme: 'default',
      layout: 'modern',
      hideModels: true,
      hideDownloadButton: false,
      darkMode: false,
      customCss: `
        .scalar-app { 
          max-width: none !important;
        }
        .scalar-card-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 8px 8px 0 0;
        }
      `
    })}'></script>
  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference@latest"></script>
</body>
</html>`

      res.setHeader('Content-Type', 'text/html')
      res.status(200).send(html)
    } catch (error) {
      console.error('Error serving API docs:', error)
      sendInternalError(res, 'Failed to load API documentation')
    }
  }

  /**
   * Serve OpenAPI specification as JSON
   */
  static async serveOpenAPISpec(req: Request, res: Response) {
    try {
      res.setHeader('Content-Type', 'application/json')
      res.status(200).json(swaggerSpec)
    } catch (error) {
      console.error('Error serving OpenAPI spec:', error)
      sendInternalError(res, 'Failed to load OpenAPI specification')
    }
  }
}