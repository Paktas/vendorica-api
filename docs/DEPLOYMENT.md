# Vendorica API Deployment Guide

## Deployment Options

This guide covers multiple deployment approaches. Choose the one that fits your infrastructure:

- **[Cloudways Deployment](#cloudways-deployment)** (Recommended - Managed VPS)
- **[Manual VPS Deployment](#manual-vps-deployment)** (Self-managed server)

---

## Cloudways Deployment

**Recommended architecture for production deployment using Cloudways managed hosting.**

### Architecture Flow
```
GitHub → GitHub Actions → Cloudways VPS → Apache (Auto-configured) → PM2 → Node.js
```

### Prerequisites

- **Cloudways Account** with Node.js application
- **GitHub Repository** with vendorica-api
- **Domain**: Pointing to Cloudways server
- **Database**: Supabase or external PostgreSQL
- **PM2**: Request installation from Cloudways support

### 1. Cloudways Application Setup

1. **Create Node.js Application**
   - Login to Cloudways dashboard
   - Create new application: **Node.js**
   - Choose server size (1GB RAM minimum, 2GB recommended)
   - Select cloud provider (DigitalOcean, AWS, Google Cloud)

2. **Domain Configuration**
   - Add your domain (e.g., `api.vendorica.com`) in Cloudways
   - Point domain DNS to Cloudways server IP
   - Enable SSL certificate (Let's Encrypt - automatic)

3. **SSH Access Setup**
   - Generate SSH key pair: `ssh-keygen -t rsa -b 4096`
   - Add public key to Cloudways SSH Keys
   - Note server details: IP, username (`master`), port

### 2. Initial Server Setup

```bash
# SSH into your Cloudways server
ssh master@your-server-ip

# Navigate to application directory
cd /home/master/applications/{app_name}/public_html

# Clone repository
git clone https://github.com/Paktas/vendorica-api.git .

# Install dependencies
npm ci --only=production
```

### 3. Environment Configuration

**Security**: All environment files are ignored by git except `.env.example`

```bash
# Copy environment template
cp .env.example .env.production

# Edit with your production values
nano .env.production
```

**Production environment variables**:
```env
NODE_ENV=production

# Database Configuration
DATABASE_URL=postgresql://user:pass@host:5432/vendorica_prod
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# API Configuration
API_BASE_URL=https://api.vendorica.com
CORS_ORIGINS=https://app.vendorica.com,https://vendorica.com

# Security
JWT_SECRET=your-super-secure-production-jwt-secret
JWT_EXPIRES_IN=7d

# Email Configuration (optional)
EMAIL_SERVICE_API_KEY=your_email_service_key
EMAIL_FROM=noreply@vendorica.com

# API Documentation
API_TITLE=Vendorica API
API_VERSION=1.0.0
API_DESCRIPTION=Enterprise vendor risk management platform API
```

### 4. PM2 Process Manager Setup

**Note**: PM2 is NOT installed by default on Cloudways. You need to:

**Option 1 (Recommended)**: Contact Cloudways support
- Open a support ticket requesting PM2 installation
- They will install it globally with proper permissions
- Usually completed within 24 hours

**Option 2**: Install locally (if permissions allow)
```bash
# Install PM2 in your application directory
cd /home/master/applications/{app_name}/public_html
npm install pm2
npx pm2 start ecosystem.config.js
```

Create PM2 ecosystem configuration:

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'vendorica-api',
    script: './dist/index.js',
    cwd: '/home/master/applications/{app_name}/public_html',
    
    // Process configuration
    instances: 2, // Use 2 instances for load balancing
    exec_mode: 'cluster',
    
    // Environment
    env: {
      NODE_ENV: 'production'
    },
    
    // Logs
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Process management
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    restart_delay: 4000,
    
    // Health monitoring
    min_uptime: '10s',
    max_restarts: 10
  }]
}
```

### 5. Initial Build and Start

```bash
# Build the application
npm run build

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### 6. Apache Configuration (Automatic)

**Cloudways automatically configures Apache reverse proxy**:

- ✅ **HTTP to HTTPS redirect** (automatic)
- ✅ **SSL certificates** (Let's Encrypt auto-renewal)
- ✅ **Reverse proxy** to Node.js application
- ✅ **Static file serving** for documentation
- ✅ **Gzip compression** enabled
- ✅ **Security headers** configured

**No manual Apache configuration needed** - Cloudways handles all web server setup.

### 7. GitHub Actions CI/CD Setup

Add secrets to your GitHub repository (`Settings > Secrets and variables > Actions`):

```
CLOUDWAYS_HOST=your-server-ip
CLOUDWAYS_USER=master  
CLOUDWAYS_SSH_KEY=your-private-ssh-key
CLOUDWAYS_PORT=22
```

Create deployment workflow:

```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Cloudways Production

on:
  push:
    branches: [main]
  workflow_dispatch: # Manual trigger

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies and build
        run: |
          npm ci
          npm run build
          
      - name: Deploy to Cloudways
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.CLOUDWAYS_HOST }}
          username: ${{ secrets.CLOUDWAYS_USER }}
          key: ${{ secrets.CLOUDWAYS_SSH_KEY }}
          port: ${{ secrets.CLOUDWAYS_PORT }}
          script: |
            cd /home/master/applications/{app_name}/public_html
            git pull origin main
            npm ci --only=production
            npm run build
            pm2 reload ecosystem.config.js --update-env
            pm2 save
            
      - name: Verify deployment
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.CLOUDWAYS_HOST }}
          username: ${{ secrets.CLOUDWAYS_USER }}
          key: ${{ secrets.CLOUDWAYS_SSH_KEY }}
          port: ${{ secrets.CLOUDWAYS_PORT }}
          script: |
            pm2 status
            curl -f https://api.vendorica.com/health || exit 1
```

### 8. Monitoring and Maintenance

**Cloudways Dashboard**:
- Server performance metrics
- Bandwidth usage
- Application logs
- SSL certificate status
- Backup management

**PM2 Commands**:
```bash
# Check application status
pm2 status

# View logs
pm2 logs vendorica-api

# Restart application
pm2 restart vendorica-api

# Monitor in real-time
pm2 monit
```

**Health Checks**:
- API Health: `https://api.vendorica.com/health`
- Documentation: `https://api.vendorica.com/docs`

### 9. Scaling Options

**Vertical Scaling** (Cloudways Dashboard):
- Increase RAM/CPU as needed
- Zero downtime scaling
- Automatic server migration

**Database Scaling**:
- Supabase handles automatic scaling
- Or migrate to dedicated PostgreSQL cluster

---

## Manual VPS Deployment

**For self-managed servers (DigitalOcean, Linode, etc.)**

### Prerequisites

- **VPS Server**: Ubuntu 22.04 LTS  
- **Node.js**: Version 18 or higher
- **npm**: Latest version
- **PM2**: Global installation (`npm install -g pm2`)
- **Web Server**: Apache or Nginx for reverse proxy
- **Database**: PostgreSQL or Supabase access

### Setup Process

Similar to Cloudways but requires manual Apache/Nginx configuration and PM2 installation.

See previous version of this file or contact support for manual VPS setup details.

---

## Support and Troubleshooting

### Common Issues

**Deployment Fails**:
- Check SSH connection: `ssh master@your-server-ip`
- Verify GitHub secrets are correctly set
- Check server disk space: `df -h`

**Application Won't Start**:
- Check PM2 status: `pm2 status`
- View logs: `pm2 logs vendorica-api`
- Verify environment variables: `cat .env.production`

**SSL Certificate Issues**:
- Cloudways auto-renews Let's Encrypt certificates
- Check SSL status in Cloudways dashboard
- Verify domain DNS pointing to correct IP

### Performance Optimization

**Server Resources**:
- Monitor memory usage: `free -h`
- Check CPU usage: `top`
- Scale server via Cloudways dashboard if needed

**Application Performance**:
- Enable PM2 monitoring: `pm2 install pm2-server-monit`
- Review application logs for errors
- Monitor database performance in Supabase dashboard

### Backup Strategy

**Automated Backups** (Cloudways):
- Server snapshots (daily/weekly)
- Database backups via Supabase
- Application code in Git repository

**Manual Backup**:
```bash
# Backup application files
tar -czf vendorica-api-backup-$(date +%Y%m%d).tar.gz /home/master/applications/{app_name}/
```

---

## Next Steps

1. **Review this deployment guide**
2. **Set up Cloudways application**
3. **Configure GitHub Actions secrets**
4. **Perform initial manual deployment**
5. **Test automated deployments**
6. **Monitor and optimize performance**

For questions or issues, refer to the troubleshooting section above or contact the development team.