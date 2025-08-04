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
- **PM2**: Request installation from Cloudways support (see section 4)
- **mod_proxy**: Request enablement from Cloudways support (see section 4)

⚠️ **Critical**: Both PM2 and mod_proxy MUST be enabled by Cloudways support before your application will work

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
   
   **Why this is critical**: 
   - TypeScript source files (`src/`) are not executable by Node.js
   - The build process compiles TypeScript to JavaScript in `dist/`
   - Setting webroot to `dist/` ensures Apache only serves compiled production code
   - Keeps source code, configuration files, and secrets outside the public directory

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

**Security**: All `.env.*` files are ignored by git except `.env.example`

**Setup Process**:
1. Copy `.env.example` to `.env.development` and `.env.production`
2. Fill in actual values for your environment
3. Never commit actual environment files

**Development (.env.development)**:
```env
NODE_ENV=development
PORT=3010
DATABASE_URL=postgresql://localhost:5432/vendorica_dev
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
API_BASE_URL=http://localhost:3010
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
JWT_SECRET=your-development-jwt-secret
```

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

**IMPORTANT**: PM2 is NOT installed by default on Cloudways. You must contact Cloudways support for installation.

**Required Steps**:

1. **Contact Cloudways Support for TWO critical items**:
   
   **A. PM2 Installation**
   - Request: "Please install PM2 globally for Node.js process management"
   - Ask them to run: `sudo npm install --location=global pm2@latest`
   - **Important**: PM2 should be installed globally on the root user, NOT on the "master" user
   - The master user is for server management, not application processes
   - This is the ONLY supported method for Cloudways
   
   **B. mod_proxy Enablement**
   - Request: "Please enable mod_proxy and mod_proxy_http for Node.js application"
   - This is enabled at the **server level**, not per application
   - Once enabled, all applications on the server can use proxy features
   - This is required for Apache to proxy requests to your Node.js app
   - Without this, you'll get 500 errors even if everything else is configured correctly
   
   Both requests are usually completed within 24 hours

2. **Application PM2 Access Setup** (handled automatically by deployment)
   - The deployment workflow creates a `.pm2` directory in your app's home directory
   - Sets proper permissions: `chown -R appuser:www-data ~/.pm2`
   - This gives your application permission to use the global PM2

3. **Verify PM2 Setup** (after Cloudways installs it)
   ```bash
   # SSH into your server
   ssh {app_id}@your-server-ip
   
   # Check PM2 installation
   pm2 --version    # Should show PM2 version
   
   # Check .pm2 directory (created by deployment)
   ls -la ~/.pm2     # Should show .pm2 directory with proper permissions
   ```

**Note**: Per Cloudways support guidance, this is the official and only supported way to use PM2 on their platform.

Create PM2 ecosystem configuration (this file is already in the repository):

```javascript
// ecosystem.config.mjs
export default {
  apps: [{
    name: 'vendorica-api',
    script: './dist/index.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    },
    watch: false,
    autorestart: true,
    max_memory_restart: '1G',
    error_file: '~/logs/vendorica-api-err.log',
    out_file: '~/logs/vendorica-api-out.log',
    log_file: '~/logs/vendorica-api-combined.log'
  }]
}
```

### 5. Apache Configuration (.htaccess)

**IMPORTANT: mod_proxy Setup Required**

Before your Node.js application can work on Cloudways, you MUST:

1. **Contact Cloudways Support** to enable `mod_proxy` on your server
   - Open a support ticket requesting: "Please enable mod_proxy for Node.js application"
   - This is disabled by default on Cloudways servers
   - mod_proxy is enabled at the **server level** (affects all applications)
   - Support usually enables it within 24 hours

2. **Webroot Configuration**
   - **Why change webroot?** By default, Cloudways serves from `/public_html`, but our compiled JavaScript files are in `/public_html/dist`. Setting webroot to `dist/` ensures Apache serves the production-ready code, not source files.
   - Cloudways webroot should be set to: `/public_html/dist`
   - The `.htaccess` file will be automatically copied to `dist/` during deployment
   - This separation keeps source code (`src/`) private while only exposing compiled files

**Apache proxy configuration (Cloudways-specific)**:

The `.htaccess` file is included in the repository root and automatically deployed to `dist/`:

```apache
# Vendorica API - Cloudways Node.js Configuration
# Routes all requests to Node.js application on port 3000

# Disable DirectoryIndex (required for Cloudways Node.js apps)
DirectoryIndex disabled

# Enable URL rewriting
RewriteEngine On
RewriteBase /

# Exclude Let's Encrypt challenge paths for SSL renewal
RewriteCond %{REQUEST_URI} !^/\.well-known/acme-challenge/

# Proxy all requests to Node.js application on port 3000
RewriteRule ^(.*)?$ http://127.0.0.1:3000/$1 [P,L]

# Note: mod_proxy must be enabled by Cloudways support
```

This configuration:
- Disables DirectoryIndex as required by Cloudways for Node.js apps
- Routes all HTTP requests to your Node.js app running on port 3000
- Maintains SSL termination at Apache level
- Excludes Let's Encrypt challenge paths for SSL renewal

**Deployment Process**:
- The `.htaccess` file is stored in the repository root
- During build, it's automatically copied to `dist/` (the webroot)
- This ensures the proxy configuration is always in the correct location

**Troubleshooting**:
- If you get 404 errors: Check that webroot is set to `/public_html/dist` in Cloudways
- If you get 500 errors: mod_proxy is not enabled - contact Cloudways support
- The `.htaccess` must be in the webroot directory (`dist/`) to work

### 6. First Deployment

**After completing the above setup, perform your first deployment:**

**⚠️ Important Notes**: 
1. Configure the webroot setting (step 3) AFTER your first successful deployment and build. This ensures the `dist/` directory exists before Apache tries to serve from it.
2. **Create .env.production file** on the server before first deployment:
   ```bash
   # SSH to server
   ssh {app_id}@your-server-ip
   cd public_html
   
   # Create production environment file
   cat > .env.production << 'EOF'
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=your_production_database_url
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_production_anon_key
   JWT_SECRET=your-super-secure-production-jwt-secret
   API_BASE_URL=https://api.vendorica.com
   CORS_ORIGINS=https://app.vendorica.com,https://vendorica.com
   EOF
   ```

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
   pm2 start ecosystem.config.mjs
   pm2 save
   pm2 startup
   ```

### 7. Apache Configuration (Automatic + .htaccess)

**Cloudways automatically provides**:

- ✅ **HTTP to HTTPS redirect** (automatic)
- ✅ **SSL certificates** (Let's Encrypt auto-renewal)
- ✅ **Apache modules** (mod_rewrite, mod_proxy enabled)
- ✅ **Gzip compression** enabled
- ✅ **Security headers** configured

**You need to provide**:

- ✅ **.htaccess file** for routing to Node.js (created by deployment workflow)
- ✅ **Port configuration** in your application (default: 3000)

**Deployment Structure**:
```
/home/{account_id}.cloudwaysapps.com/{app_id}/public_html/
├── src/                     # Source code (not served by Apache)
├── dist/                    # Compiled JavaScript ← Apache webroot points here
│   ├── index.js            # Node.js entry point
│   └── ...                 # Compiled application files
├── package.json             # Dependencies
├── ecosystem.config.mjs     # PM2 configuration
├── .env.production          # Environment variables
└── ...                      # Other project files
```

**After configuring webroot to `/public_html/dist`:**
- **Apache serves**: Files from `dist/` directory (compiled application)
- **PM2 runs**: Node.js application from `dist/index.js`
- **API endpoints**: Handled by Node.js, proxied through Apache
- **Source code**: Remains in `public_html/src/` but not served by Apache

### 8. GitHub Actions CI/CD Setup

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

**Deployment Workflow Structure:**

The automated deployment workflow consists of 7 focused stages:

1. **Checkout code** - Get latest repository code
2. **Setup Node.js** - Prepare build environment  
3. **Install dependencies and build** - Build application locally
4. **Debug GitHub Secrets** - Verify deployment credentials
5. **Test SSH Connection** - Confirm server connectivity
6. **Check Server Environment** - Verify server prerequisites
7. **Clean Deployment Directory** - Prepare deployment location
8. **Clone Repository** - Deploy code to production server
9. **Install Dependencies and PM2** - Install production dependencies
10. **Build Application** - Compile TypeScript on production server
11. **Setup and Verify PM2 Process** - Complete PM2 process management:
    - Start PM2 cluster processes
    - Verify PM2 status and logs
    - Check environment configuration
    - Verify network port binding
12. **Deployment Summary** - High-level completion confirmation

**Key Features:**
- **Comprehensive PM2 Management**: Single stage handles all PM2 operations (start, verify, logs, environment, network)
- **Fallback Support**: Automatic fallback to direct Node.js execution if PM2 unavailable
- **Environment Preservation**: Maintains `.env.production` and `.env.local` files during deployment
- **Clean Directory Management**: Safe cleanup and repository cloning
- **Immediate Verification**: Real-time PM2 status and application health checks

The workflow is already configured in `.github/workflows/deploy-production.yml` and runs automatically on pushes to the `main` branch.

### 9. Monitoring and Maintenance

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

### 10. Scaling Options

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

## Development Workflow

### Local Development
1. `npm install` - Install dependencies
2. `npm run dev` - Start development server with HMR
3. API available at http://localhost:3010 (development only)
4. Changes automatically reload via Vite HMR

### Production Deployment
1. `npm run build` - Compile TypeScript to JavaScript
2. `npm start` - Start production server via PM2
3. Apache reverse proxy routes to Node.js application

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