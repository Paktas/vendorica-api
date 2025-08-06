# Vendorica API Deployment Guide

## Table of Contents

1. [Overview](#overview)
2. [Cloudways Application Setup](#1-cloudways-application-setup)
3. [SSH & Security Setup](#2-ssh--security-setup)
4. [Environment & Configuration](#3-environment--configuration)
5. [Server Requirements (Contact Cloudways Support)](#4-server-requirements-contact-cloudways-support)
6. [GitHub Actions CI/CD Setup](#5-github-actions-cicd-setup)
7. [Deployment Process](#6-deployment-process)
8. [Monitoring & Troubleshooting](#7-monitoring--troubleshooting)
9. [Development Workflow](#development-workflow)
10. [Quick Start Checklist](#quick-start-checklist)

---

## Overview

**Recommended architecture for production deployment using Cloudways managed hosting.**

### Architecture Flow
```
GitHub → GitHub Actions → Cloudways VPS → Apache (Auto-configured) → PM2 → Node.js
```

### Prerequisites & Requirements

**Required Services:**
- **Cloudways Account** with Node.js application
- **GitHub Repository** with vendorica-api
- **Domain**: Pointing to Cloudways server
- **Database**: Supabase or external PostgreSQL

**Critical Cloudways Support Requests** (contact before setup):
- **PM2**: Request global installation (`sudo npm install --location=global pm2@latest`)
- **mod_proxy**: Request Apache module enablement for Node.js proxy
- Both typically completed within 24 hours

⚠️ **Critical**: Both PM2 and mod_proxy MUST be enabled by Cloudways support before deployment

---

## 1. Cloudways Application Setup

### Create Application & Domain
1. **Create Node.js Application**
   - Login to Cloudways dashboard
   - Create new application: **Node.js**
   - Choose server size (1GB RAM minimum, 2GB recommended)
   - Select cloud provider (DigitalOcean, AWS, Google Cloud)

2. **Domain Configuration**
   - Add your domain (e.g., `api.vendorica.com`) in Cloudways
   - Point domain DNS to Cloudways server IP
   - Enable SSL certificate (Let's Encrypt - automatic)

### Configure Webroot (Critical)
⚠️ **IMPORTANT**: Configure webroot AFTER first successful deployment
- In Cloudways: Application → Application Settings → Webroot
- Change from `/public_html` to `/public_html/dist`
- **Why**: TypeScript compiles to `dist/`, Apache must serve compiled code, not source
- **Security**: Keeps source code (`src/`) and secrets outside public directory

---

## 2. SSH & Security Setup

### Generate SSH Key Pair
**Run locally on your development machine:**
```bash
# Generate SSH key pair with specific filename
ssh-keygen -t rsa -b 4096 -C "github-actions@vendorica-api" -f ~/.ssh/vendorica_api_deploy_key

# When prompted - use NO passphrase for CI/CD automation:
# - Enter file: ~/.ssh/vendorica_api_deploy_key
# - Enter passphrase: [PRESS ENTER]
# - Confirm passphrase: [PRESS ENTER]

# Creates two files:
# - ~/.ssh/vendorica_api_deploy_key (private key - NEVER share)
# - ~/.ssh/vendorica_api_deploy_key.pub (public key - safe to share)
```

### Security Configuration
**Add private key to `.gitignore`:**
```bash
echo "*.pem" >> .gitignore
echo "*_key" >> .gitignore  
echo "vendorica_api_deploy_key*" >> .gitignore
```

### Add Public Key to Cloudways
1. Copy public key: `cat ~/.ssh/vendorica_api_deploy_key.pub`
2. In Cloudways: Application Access → Add SSH Key
3. Paste the public key content and save

### Server Information
**Find your deployment details:**
- **Account ID**: Found in Cloudways URL (e.g., `1462634`)
- **App ID**: SSH username in Application Access (e.g., `jwnbrgtuur`)
- **WebRoot**: `/home/{account_id}.cloudwaysapps.com/{app_id}/public_html`
- **Server IP**: Your Cloudways server IP address
- **SSH Port**: Usually 22 (check server settings)

---

## 3. Environment & Configuration

### Environment Detection Implementation
The application uses a **clean NODE_ENV-based approach** for environment detection:

```typescript
// src/index.ts - Environment Loading
import dotenv from 'dotenv'

// Clean environment loading based on NODE_ENV
const environment = process.env.NODE_ENV || 'development'
console.log(`🔧 Loading ${environment} environment`)

// Load appropriate environment file
if (environment === 'production') {
  const result = dotenv.config({ path: '.env.production' })
  if (result.error) {
    console.error('❌ Error loading .env.production:', result.error.message)
  } else {
    console.log('✅ Production environment loaded')
  }
} else {
  const result = dotenv.config({ path: '.env.development' })
  if (result.error) {
    console.error('❌ Error loading .env.development:', result.error.message)
  } else {
    console.log('✅ Development environment loaded')
  }
}
```

**Key Benefits:**
- ✅ Standard NODE_ENV approach (industry standard)
- ✅ Clean implementation (no server-specific hacks)
- ✅ Development compatibility (works seamlessly locally)
- ✅ Production reliability (correctly detects via PM2)

### Local Development Setup
1. Copy `.env.example` to `.env.development`
2. Configure your development values:

```env
NODE_ENV=development
PORT=3010
DATABASE_URL=postgresql://localhost:5432/vendorica_dev
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your-development-jwt-secret
RESEND_API_KEY=your_resend_api_key
```

### Production Environment Management
**Secure & Automated**:
- Production environment variables managed through GitHub Secrets
- `.env.production` file automatically created during deployment
- Environment variables never exposed in repository
- No manual file creation needed

---

## 4. Server Requirements (Contact Cloudways Support)

**CRITICAL**: Contact Cloudways support to enable these requirements before deployment:

### Request #1: PM2 Installation
**Support Request**: "Please install PM2 globally for Node.js process management"
- Command they run: `sudo npm install --location=global pm2@latest`
- Must be installed on root user (NOT master user)
- This is the only supported method for Cloudways

### Request #2: Apache mod_proxy Module
**Support Request**: "Please enable mod_proxy and mod_proxy_http for Node.js application"
- Enabled at server level (affects all applications)
- Required for Apache to proxy requests to Node.js
- Without this: 500 errors even with correct configuration

**Timeline**: Both requests typically completed within 24 hours

### PM2 Configuration
**ecosystem.config.mjs** (already in repository):
```javascript
export default {
  apps: [{
    name: 'vendorica-api',
    script: './dist/index.js',
    instances: 2,
    exec_mode: 'cluster',
    watch: false,
    autorestart: true,
    max_memory_restart: '1G',
    error_file: './logs/vendorica-api-err.log',
    out_file: './logs/vendorica-api-out.log',
    log_file: './logs/vendorica-api-combined.log',
    time: true
  }]
}
```

**Production Deployment Command**:
```bash
NODE_ENV=production pm2 start dist/index.js --name vendorica-api --instances 2
```

### Apache Configuration (.htaccess)
**Automatic deployment** - `.htaccess` file included in repository and copied to `dist/`:

```apache
# Vendorica API - Cloudways Node.js Configuration
DirectoryIndex disabled
RewriteEngine On
RewriteBase /
RewriteCond %{REQUEST_URI} !^/\.well-known/acme-challenge/
RewriteRule ^(.*)?$ http://127.0.0.1:3000/$1 [P,L]
```

**What Cloudways provides automatically**:
- ✅ HTTP to HTTPS redirect
- ✅ SSL certificates (Let's Encrypt auto-renewal)
- ✅ Gzip compression
- ✅ Security headers

---

## 5. GitHub Actions CI/CD Setup

### Create GitHub Secrets
Navigate to: GitHub repository → Settings → Secrets and variables → Actions → New repository secret

**Required secrets:**

| Secret Name | Value | Description |
|------------|--------|-----------|
| `CLOUDWAYS_HOST` | `164.90.xxx.xxx` | Your Cloudways server IP |
| `CLOUDWAYS_USER` | `{app_id}` | Your application ID (SSH username) |
| `CLOUDWAYS_SSH_KEY` | Private key content | Full private key including BEGIN/END lines |
| `CLOUDWAYS_PORT` | `22` | SSH port (usually 22) |
| `ENV_PRODUCTION` | Environment variables | Complete production config (see below) |

### ENV_PRODUCTION Secret Content
**Complete production environment configuration:**
```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@host:5432/vendorica_prod
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CORS_ORIGINS=https://app.vendorica.com,https://vendorica.com
FRONTEND_URL=https://app.vendorica.com
JWT_SECRET=your-super-secure-production-jwt-secret
JWT_EXPIRES_IN=7d
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=noreply@vendorica.com
API_TITLE=Vendorica API
API_VERSION=1.0.0
API_DESCRIPTION=Enterprise vendor risk management platform API
```

**Important**: Enter values exactly as shown, one per line, no quotes around content.

### Deployment Workflow Features
The workflow (`.github/workflows/deploy-production.yml`) includes:

**Optimized Process:**
1. **Build Preparation** (local): Checkout code, setup Node.js, install & build
2. **Connection Verification**: Debug secrets, test SSH, check server environment
3. **Clean Deployment**: Complete directory wipe for fresh deployment
4. **Repository & Environment**: Clone repository + create `.env.production` from secrets
5. **Build & PM2 Setup**: Install dependencies, build TypeScript, configure PM2
6. **Verification**: Deployment summary with status confirmation

**Key Features:**
- ✅ **Optimized SSH**: 5 connections instead of 7+ by combining operations
- ✅ **Secure Environment**: `.env.production` created from GitHub Secrets
- ✅ **Zero-downtime**: PM2 reload for existing processes, fresh start for new
- ✅ **Comprehensive**: Automatic fallback to direct Node.js if PM2 unavailable
- ✅ **Automated**: Runs on every push to `main` branch

---

## 6. Deployment Process

### Automated Deployment (Recommended)
**Push to `main` branch** - GitHub Actions handles everything automatically

### Manual Deployment (If Needed)
```bash
# SSH to server
ssh {app_id}@your-server-ip

# Verify you're in webroot
pwd  # Should show: /home/{account_id}.cloudwaysapps.com/{app_id}/public_html

# First time: Clone repository
git clone https://github.com/Paktas/vendorica-api.git .

# Install, build, and start
npm ci --omit=dev
npm run build
NODE_ENV=production pm2 start dist/index.js --name vendorica-api --instances 2
pm2 save
pm2 startup
```

### Deployment Structure
```
/home/{account_id}.cloudwaysapps.com/{app_id}/public_html/
├── src/                     # Source code (private)
├── dist/                    # Compiled JS ← Apache webroot
│   ├── index.js            # Node.js entry point
│   ├── .htaccess           # Apache proxy config
│   └── ...                 # Compiled files
├── ecosystem.config.mjs     # PM2 configuration
├── .env.production          # Environment (auto-created)
└── package.json             # Dependencies
```

### Post-Deployment
**Configure webroot** (after first successful build):
- Cloudways → Application Settings → Webroot
- Change to: `/public_html/dist`
- This serves compiled code only, keeps source private

---

## 7. Monitoring & Troubleshooting

### Health Checks
- **API Health**: `https://api.vendorica.com/health`
- **Documentation**: `https://api.vendorica.com/docs`
- **Root Endpoint**: `https://api.vendorica.com/`

### PM2 Management
```bash
# Check status
pm2 status

# View logs
pm2 logs vendorica-api

# Restart application
pm2 restart vendorica-api

# Real-time monitoring
pm2 monit
```

### Common Issues & Solutions

**500 Errors**:
- mod_proxy not enabled → Contact Cloudways support
- Check `.htaccess` is in `dist/` directory

**404 Errors**:
- Webroot not set to `/public_html/dist`
- Ensure `dist/` directory exists after build

**"development" Environment**:
- Check `ENV_PRODUCTION` GitHub Secret is set
- Redeploy to refresh environment variables

**PM2 Issues**:
- Check `pm2 logs` for import errors
- Verify build completed: `ls dist/index.js`
- Restart: `pm2 restart vendorica-api`

**Deployment Fails**:
- Check SSH connection: `ssh {app_id}@your-server-ip`
- Verify GitHub secrets are correct
- Check server disk space: `df -h`

### Performance & Scaling

**Cloudways Dashboard**:
- Server performance metrics
- Bandwidth usage
- SSL certificate status
- Automated backups

**Vertical Scaling**:
- Increase RAM/CPU via dashboard
- Zero downtime scaling
- Automatic server migration

**Database Scaling**:
- Supabase handles automatic scaling
- Option to migrate to dedicated PostgreSQL cluster

---

## Development Workflow

### Local Development
1. `npm install` - Install dependencies
2. `npm run dev` - Start development server with HMR
3. API available at http://localhost:3010
4. Changes automatically reload via Vite HMR

### Production Deployment
1. `npm run build` - Compile TypeScript to JavaScript
2. `NODE_ENV=production npm start` - Start via PM2
3. Apache reverse proxy routes to Node.js application

---

## Quick Start Checklist

1. ✅ **Contact Cloudways Support**: Request PM2 + mod_proxy enablement
2. ✅ **Create Cloudways Application**: Node.js app with domain and SSL
3. ✅ **Generate SSH Keys**: Create key pair and add public key to Cloudways
4. ✅ **Configure GitHub Secrets**: Add all 5 required secrets
5. ✅ **First Deployment**: Push to `main` branch (GitHub Actions)
6. ✅ **Configure Webroot**: Set to `/public_html/dist` after first build
7. ✅ **Verify**: Check health endpoints show "production" environment

---

For questions or issues, refer to the troubleshooting section above or contact the development team.