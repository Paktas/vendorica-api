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

3. **⚠️ IMPORTANT: Configure Webroot Path**
   - In Cloudways: Navigate to your Application → Application Settings
   - Find "Webroot" field (currently shows `/public_html`)
   - Change Webroot to: `/public_html/dist`
   - Save settings
   
   **Why**: This points Apache to serve from the compiled JavaScript files instead of source code.

4. **SSH Access Setup**
   
   **Cloudways Application Access**:
   1. In Cloudways: Navigate to your Application → Application Access
   2. Note your application username (e.g., `jwnbrgtuur`)
   3. WebRoot path: `/home/{account_id}.cloudwaysapps.com/{app_id}/public_html`
   4. WebLogs path: `/home/{account_id}.cloudwaysapps.com/{app_id}/logs`
   
   **How to find your values:**
   - **Account ID**: Found in Cloudways URL or when you SSH (e.g., `1462634`)
   - **App ID**: Your SSH username shown in Cloudways Application Access (e.g., `jwnbrgtuur`)
   - **WebRoot**: Shown when you log in via SSH: `WebRoot: [/home/{account_id}.cloudwaysapps.com/{app_id}/public_html]`
   
   **For this deployment:**
   - Account ID: `1462634`
   - App ID: `jwnbrgtuur`
   - WebRoot: `/home/1462634.cloudwaysapps.com/jwnbrgtuur/public_html`
   
   **Generate SSH Key Pair** (run locally on your development machine):
   ```bash
   # Generate SSH key pair with specific filename (use underscores)
   ssh-keygen -t rsa -b 4096 -C "github-actions@vendorica-api" -f ~/.ssh/vendorica_api_deploy_key
   
   # When prompted:
   # - Enter file in which to save the key: ~/.ssh/vendorica_api_deploy_key
   # - Enter passphrase (empty for no passphrase): [PRESS ENTER - no passphrase for CI/CD]
   # - Enter same passphrase again: [PRESS ENTER]
   
   # This creates two files:
   # - ~/.ssh/vendorica_api_deploy_key (private key - NEVER share this)
   # - ~/.ssh/vendorica_api_deploy_key.pub (public key - safe to share)
   ```
   
   **⚠️ Security Important**: Add private key to `.gitignore`:
   ```bash
   # Add to your project's .gitignore file
   echo "*.pem" >> .gitignore
   echo "*_key" >> .gitignore  
   echo "vendorica_api_deploy_key" >> .gitignore
   echo "vendorica_api_deploy_key.pub" >> .gitignore
   ```
   
   **Add Public Key to Cloudways**:
   1. Copy public key: `cat ~/.ssh/vendorica_api_deploy_key.pub`
   2. In Cloudways: Application Access → Add SSH Key
   3. Paste the public key content
   4. Save changes
   
   **Note Server Details**:
   - Server IP: Your Cloudways server IP
   - Username: `{app_id}` (Your Cloudways application ID)
   - Port: Usually 22 (check your server settings)

### 2. Initial Server Setup

**One-time server configuration** (run once when setting up the server):

```bash
# SSH into your Cloudways server
ssh {app_id}@your-server-ip

# Verify server environment
node --version    # Should be 18.x or higher
npm --version     # Should be 9.x or higher
which git         # Verify git is installed

# Check current directory (SSH logs directly into webroot)
pwd              # Should show: /home/{account_id}.cloudwaysapps.com/{app_id}/public_html
ls -la           # View webroot contents

# Note: Cloudways SSH logs you directly into public_html (the webroot)
# This is where we'll deploy the vendorica-api repository

# Verify webroot is ready for deployment
ls -la           # Should be empty or contain default files
```

**Note**: Repository cloning and dependency installation will be handled during the first deployment.

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
# Install PM2 in your API directory
cd /home/{account_id}.cloudwaysapps.com/{app_id}/public_html
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
    cwd: '/home/{account_id}.cloudwaysapps.com/{app_id}/public_html',
    
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

### 5. First Deployment

**After completing the above setup, perform your first deployment:**

**⚠️ Note**: Configure the webroot setting (step 3) AFTER your first successful deployment and build. This ensures the `dist/` directory exists before Apache tries to serve from it.

1. **Use GitHub Actions** (recommended):
   - Push code to `main` branch
   - GitHub Actions will automatically deploy

2. **Or manual deployment**:
   ```bash
   # SSH to server (logs directly into public_html)
   ssh {app_id}@your-server-ip
   
   # Verify you're in the webroot
   pwd    # Should show: /home/{account_id}.cloudwaysapps.com/{app_id}/public_html
   
   # Clone repository directly into webroot (first time only)
   git clone https://github.com/Paktas/vendorica-api.git .
   
   # Install dependencies and build
   npm ci --only=production
   npm run build
   
   # Start with PM2
   pm2 start ecosystem.config.js
   pm2 save
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

**Deployment Structure**:
```
/home/{account_id}.cloudwaysapps.com/{app_id}/public_html/
├── src/                     # Source code (not served by Apache)
├── dist/                    # Compiled JavaScript ← Apache webroot points here
│   ├── index.js            # Node.js entry point
│   └── ...                 # Compiled application files
├── package.json             # Dependencies
├── ecosystem.config.js      # PM2 configuration
├── .env.production          # Environment variables
└── ...                      # Other project files
```

**After configuring webroot to `/public_html/dist`:**
- **Apache serves**: Files from `dist/` directory (compiled application)
- **PM2 runs**: Node.js application from `dist/index.js`
- **API endpoints**: Handled by Node.js, proxied through Apache
- **Source code**: Remains in `public_html/src/` but not served by Apache

### 7. GitHub Actions CI/CD Setup

**Step 1: Generate SSH Key Pair** (if not already done)
```bash
# Generate SSH key pair with specific filename (use underscores)
ssh-keygen -t rsa -b 4096 -C "github-actions@vendorica-api" -f ~/.ssh/vendorica_api_deploy_key
# Don't use passphrase for automated deployments
```

**Step 2: Add Public Key to Cloudways**
1. Copy public key: `cat ~/.ssh/vendorica_api_deploy_key.pub`
2. In Cloudways: Application Access → Add SSH Key
3. Add the SSH public key content
4. Save changes

**Step 3: Create GitHub Secrets**

Navigate to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

Create these secrets:

| Secret Name | Value | Description |
|------------|--------|-------------|
| `CLOUDWAYS_HOST` | `164.90.xxx.xxx` | Your Cloudways server IP address |
| `CLOUDWAYS_USER` | `{app_id}` | Your Cloudways application ID |
| `CLOUDWAYS_SSH_KEY` | `-----BEGIN RSA PRIVATE KEY-----...` | Contents of your private key file |
| `CLOUDWAYS_PORT` | `22` | SSH port (default is 22, check your server) |

**Important**: For `CLOUDWAYS_SSH_KEY`, copy the ENTIRE private key including the BEGIN and END lines:
```
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
[full key content]
...
-----END RSA PRIVATE KEY-----
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
            # SSH logs directly into public_html, so we're already in the right place
            pwd  # Verify: /home/{account_id}.cloudwaysapps.com/{app_id}/public_html
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

**404 Errors or "File not found"**:
- Verify webroot is set to `/public_html/dist` in Application Settings
- Ensure `npm run build` completed successfully and `dist/` directory exists
- Check that `dist/index.js` file is present

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