# Vendorica API Deployment Guide

## Prerequisites

- **Node.js**: Version 18 or higher
- **npm**: Latest version
- **PM2**: Global installation (`npm install -g pm2`)
- **Web Server**: Apache or Nginx for reverse proxy
- **Database**: PostgreSQL or Supabase access

## Environment Setup

### 1. Clone and Install

```bash
git clone <repository-url> vendorica-api
cd vendorica-api
npm install
```

### 2. Environment Configuration

**Security**: All environment files are ignored by git except `.env.example`

Copy and configure the production environment file:

```bash
cp .env.example .env.production
```

Edit `.env.production` with your production values:

```env
NODE_ENV=production
# NO PORT - Web server handles routing
DATABASE_URL=postgresql://user:pass@host:5432/vendorica_prod
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_production_anon_key
API_BASE_URL=https://api.vendorica.com
CORS_ORIGINS=https://app.vendorica.com,https://vendorica.com
```

## Deployment Process

### 1. Build Application

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

### 2. Start Production Server

```bash
npm start
```

This uses PM2 to start the application in cluster mode with 2 instances.

### 3. Verify Deployment

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs vendorica-api

# Monitor performance
pm2 monit
```

## Web Server Configuration

### Apache Configuration

Create a virtual host configuration:

```apache
<VirtualHost *:80>
    ServerName api.vendorica.com
    
    # Redirect HTTP to HTTPS
    Redirect permanent / https://api.vendorica.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName api.vendorica.com
    
    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /path/to/certificate.crt
    SSLCertificateKeyFile /path/to/private.key
    
    # Proxy to Node.js application
    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
    
    # Headers for proper proxying
    ProxyPassReverse / http://localhost:3000/
    RequestHeader set X-Forwarded-Proto "https"
    RequestHeader set X-Forwarded-Port "443"
    
    # Log files
    ErrorLog ${APACHE_LOG_DIR}/api.vendorica.com_error.log
    CustomLog ${APACHE_LOG_DIR}/api.vendorica.com_access.log combined
</VirtualHost>
```

Enable required modules:
```bash
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod headers
sudo a2enmod ssl
sudo systemctl restart apache2
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name api.vendorica.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.vendorica.com;

    # SSL Configuration
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## PM2 Management

### Basic Commands

```bash
# Start application
pm2 start ecosystem.config.js

# Stop application
pm2 stop vendorica-api

# Restart application
pm2 restart vendorica-api

# Reload application (zero downtime)
pm2 reload vendorica-api

# Delete application from PM2
pm2 delete vendorica-api

# View logs
pm2 logs vendorica-api

# Monitor resources
pm2 monit

# Show application info
pm2 show vendorica-api
```

### Auto-Start on System Boot

```bash
# Generate startup script
pm2 startup

# Save current PM2 process list
pm2 save
```

## Health Monitoring

### Application Health Check

The API provides a health check endpoint:

```bash
curl https://api.vendorica.com/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

### PM2 Monitoring

```bash
# View real-time logs
pm2 logs --lines 100

# Monitor CPU and memory usage
pm2 monit

# Generate process report
pm2 report
```

## Database Setup

### Supabase Configuration

1. Create a new Supabase project
2. Run database migrations:
   ```bash
   # Navigate to database migrations
   cd database/migrations
   
   # Apply migrations in order
   psql $DATABASE_URL -f 001_create_initial_tables/up.sql
   psql $DATABASE_URL -f 002_add_user_preferences/up.sql
   # ... continue with remaining migrations
   ```

### PostgreSQL Setup

If using standalone PostgreSQL:

1. Create database and user:
   ```sql
   CREATE DATABASE vendorica_prod;
   CREATE USER vendorica_user WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE vendorica_prod TO vendorica_user;
   ```

2. Run migrations as shown above

## Security Considerations

### Environment Variables
- Never commit `.env.production` to version control
- Use secure, randomly generated passwords and keys
- Regularly rotate API keys and database passwords

### Web Server Security
- Always use HTTPS in production
- Configure proper SSL certificates
- Set up firewall rules to restrict database access
- Enable web server security headers

### Application Security
- Keep Node.js and dependencies updated
- Regular security audits: `npm audit`
- Monitor for security vulnerabilities
- Implement rate limiting in web server configuration

## Backup and Recovery

### Database Backups
```bash
# Create database backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
psql $DATABASE_URL < backup_file.sql
```

### Application Backups
- Backup application code and configuration
- Backup PM2 process configuration: `pm2 save`
- Backup web server configuration files

## Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check PM2 logs
pm2 logs vendorica-api

# Check if port is in use
netstat -tlnp | grep :3000

# Verify environment variables
pm2 show vendorica-api
```

#### Database Connection Issues
```bash
# Test database connection
psql $DATABASE_URL -c "SELECT version();"

# Check database logs
# (Location varies by installation)
```

#### Web Server Issues
```bash
# Check Apache status
sudo systemctl status apache2

# Check Apache logs
sudo tail -f /var/log/apache2/error.log

# Test configuration
sudo apache2ctl configtest
```

### Performance Monitoring

```bash
# View PM2 metrics
pm2 monit

# Check system resources
htop
iotop
```

## Scaling

### Horizontal Scaling
- Increase PM2 cluster instances in `ecosystem.config.js`
- Add load balancer between web server and Node.js instances
- Consider container orchestration (Docker + Kubernetes)

### Vertical Scaling
- Increase server memory and CPU
- Optimize database queries and indexes
- Implement caching layer (Redis)

## Maintenance

### Regular Updates
```bash
# Update dependencies
npm update

# Security audit
npm audit fix

# Rebuild application
npm run build

# Reload PM2 (zero downtime)
pm2 reload vendorica-api
```

### Log Rotation
PM2 automatically handles log rotation, but you can configure it:

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```