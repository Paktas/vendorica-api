/**
 * Request utilities for Node.js HTTP requests
 */

/**
 * Parse JSON body from Node.js request
 * @param {Request} req - Node.js request object
 * @returns {Promise<Object>} Parsed JSON body
 */
export async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => {
      body += chunk.toString()
    })
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch (error) {
        reject(error)
      }
    })
  })
}

/**
 * Send JSON response with proper headers
 * @param {Response} res - Node.js response object
 * @param {number} statusCode - HTTP status code
 * @param {Object} data - Response data
 */
export function sendJson(res, statusCode, data) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.end(JSON.stringify(data))
}

/**
 * Create Express-style request/response objects for controllers
 * @param {Request} req - Node.js request object
 * @param {Response} res - Node.js response object
 * @param {Object} body - Request body (optional)
 * @param {Object} params - Route parameters (optional)
 * @param {Object} user - Authenticated user (optional)
 * @returns {Object} Express-style req/res objects
 */
export function createExpressObjects(req, res, body = null, params = null, user = null) {
  const mockReq = {
    ...req,
    body: body || {},
    headers: req.headers,
    method: req.method,
    url: req.url,
    params: params || {},
    user: user || null
  }
  
  const mockRes = {
    status: (code) => {
      res.statusCode = code
      return mockRes
    },
    json: (data) => {
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      res.end(JSON.stringify(data))
      return mockRes
    },
    setHeader: (key, value) => res.setHeader(key, value),
    end: (data) => res.end(data)
  }
  
  return { mockReq, mockRes }
}