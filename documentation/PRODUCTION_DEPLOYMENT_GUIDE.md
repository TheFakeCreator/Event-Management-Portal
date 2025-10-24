# Production Deployment Guide

## 🚀 Overview

This guide provides comprehensive instructions for deploying the Event Management Portal to production environments. The application supports multiple deployment strategies including containerized deployment, cloud deployment, and bare-metal installation.

## 📋 Prerequisites

### System Requirements

#### Minimum Requirements
- **CPU**: 2 cores (4 recommended)
- **RAM**: 4GB (8GB recommended)
- **Storage**: 20GB (50GB recommended)
- **Network**: Stable internet connection

#### Software Requirements
- **Operating System**: Linux (Ubuntu 20.04+, CentOS 8+, RHEL 8+) or macOS
- **Docker**: 20.0+ and Docker Compose 2.0+
- **Node.js**: v18+ (if running without containers)
- **Git**: For source code management
- **SSL Certificate**: For HTTPS (Let's Encrypt or commercial)

### External Services

#### Required Services
- **MongoDB**: 4.4+ (Atlas, self-hosted, or cloud provider)
- **Redis**: 6.0+ (Redis Cloud, ElastiCache, or self-hosted)
- **SMTP Server**: For email notifications (Gmail, SendGrid, etc.)
- **Cloudinary**: For image and file storage

#### Optional Services
- **CDN**: CloudFlare, AWS CloudFront for static assets
- **Load Balancer**: AWS ALB, Nginx for high availability
- **Monitoring**: Prometheus/Grafana (included in deployment)

## 🔧 Pre-Deployment Setup

### 1. Server Preparation

#### Update System
```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y
```

#### Install Docker and Docker Compose
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group (requires logout/login)
sudo usermod -aG docker $USER
```

#### Configure Firewall
```bash
# Allow necessary ports
sudo ufw allow 22      # SSH
sudo ufw allow 80      # HTTP
sudo ufw allow 443     # HTTPS
sudo ufw allow 3000    # Application (if not behind proxy)
sudo ufw enable
```

### 2. Source Code Setup

#### Clone Repository
```bash
# Clone the repository
git clone https://github.com/YourOrg/Event-Management-Portal.git
cd Event-Management-Portal

# Switch to production branch (if applicable)
git checkout main  # or production branch
```

#### Verify Prerequisites
```bash
# Run the deployment prerequisite check
./scripts/deploy-monitoring.sh check
```

### 3. Environment Configuration

#### Production Environment File
Create `.env.production` with production-ready configuration:

```bash
# Copy and customize the environment template
cp .env.example .env.production
```

#### Required Production Environment Variables

```env
#==============================================
# APPLICATION CONFIGURATION
#==============================================
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://yourdomain.com

#==============================================
# DATABASE CONFIGURATION
#==============================================
# MongoDB Atlas or production MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/eventmanagement?retryWrites=true&w=majority

# Redis (production instance)
REDIS_URL=redis://username:password@redis-host:6379

#==============================================
# JWT CONFIGURATION (Generate secure secrets)
#==============================================
JWT_SECRET=your_super_secure_jwt_secret_min_32_chars
JWT_REFRESH_SECRET=your_super_secure_refresh_secret_min_32_chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

#==============================================
# CLOUDINARY CONFIGURATION
#==============================================
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

#==============================================
# EMAIL CONFIGURATION
#==============================================
# Production SMTP configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Event Management Portal

#==============================================
# SECURITY CONFIGURATION
#==============================================
# Session secret (generate with openssl rand -base64 32)
SESSION_SECRET=your_secure_session_secret

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

#==============================================
# LOGGING & MONITORING
#==============================================
LOGGING_LEVEL=info
PROMETHEUS_ENABLED=true
GRAFANA_ADMIN_PASSWORD=secure_grafana_password

#==============================================
# SSL & SECURITY
#==============================================
FORCE_HTTPS=true
TRUST_PROXY=true

#==============================================
# PERFORMANCE
#==============================================
COMPRESSION_ENABLED=true
CACHE_TTL_SECONDS=300
MAX_UPLOAD_SIZE=10485760  # 10MB
```

#### Generate Secure Secrets
```bash
# Generate JWT secrets
openssl rand -base64 32  # Use for JWT_SECRET
openssl rand -base64 32  # Use for JWT_REFRESH_SECRET
openssl rand -base64 32  # Use for SESSION_SECRET
```

## 🚢 Deployment Strategies

### Strategy 1: Automated Deployment (Recommended)

#### Quick Deployment
```bash
# Run the automated deployment script
./scripts/deploy-app.sh deploy --environment production

# This will:
# 1. Validate prerequisites
# 2. Build application containers
# 3. Deploy with Docker Compose
# 4. Start monitoring stack
# 5. Run health checks
# 6. Display access information
```

#### Step-by-Step Automated Deployment
```bash
# 1. Check prerequisites
./scripts/deploy-app.sh check

# 2. Build application
./scripts/deploy-app.sh build --environment production

# 3. Deploy application
./scripts/deploy-app.sh deploy --environment production

# 4. Deploy monitoring (optional)
./scripts/deploy-monitoring.sh

# 5. Validate deployment
./scripts/validate-monitoring.sh
```

### Strategy 2: Manual Docker Deployment

#### Build Production Images
```bash
# Build all production images
docker-compose -f docker-compose.prod.yml build

# Or build specific services
docker-compose -f docker-compose.prod.yml build backend
```

#### Deploy with Docker Compose
```bash
# Start production services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Check service status
docker-compose -f docker-compose.prod.yml ps
```

### Strategy 3: Cloud Platform Deployment

#### AWS Deployment (Using ECS/Fargate)

1. **Push Images to ECR**:
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com

# Tag and push images
docker tag event-management-backend <account>.dkr.ecr.us-east-1.amazonaws.com/event-management-backend:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/event-management-backend:latest
```

2. **Deploy with ECS Task Definition** (use provided `aws-ecs-task-definition.json`)

#### Google Cloud Platform (Using Cloud Run)

```bash
# Build and deploy
gcloud run deploy event-management-backend \
  --image gcr.io/PROJECT-ID/event-management-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

#### Azure (Using Container Instances)

```bash
# Deploy container group
az container create \
  --resource-group myResourceGroup \
  --name event-management \
  --image your-registry.azurecr.io/event-management-backend:latest \
  --ports 3000 \
  --environment-variables NODE_ENV=production
```

### Strategy 4: Bare Metal/VPS Deployment

#### Install Node.js and Dependencies
```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PM2 for process management
npm install -g pm2
```

#### Build and Deploy Application
```bash
# Install dependencies
pnpm install --frozen-lockfile

# Build application
pnpm build:prod

# Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

## 🔒 SSL/HTTPS Configuration

### Option 1: Let's Encrypt with Certbot

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### Option 2: Cloudflare SSL (Recommended)

1. **Add your domain to Cloudflare**
2. **Update nameservers** to Cloudflare's
3. **Enable SSL/TLS** in Cloudflare dashboard
4. **Set SSL mode** to "Full (strict)" or "Flexible"

### Option 3: Custom SSL Certificate

```bash
# Place your certificate files
sudo mkdir -p /etc/ssl/certs/
sudo cp your-domain.crt /etc/ssl/certs/
sudo cp your-domain.key /etc/ssl/private/
sudo chmod 600 /etc/ssl/private/your-domain.key
```

## 🔄 Reverse Proxy Setup (Nginx)

### Install Nginx
```bash
sudo apt update
sudo apt install nginx
```

### Configure Nginx
Create `/etc/nginx/sites-available/event-management`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/ssl/certs/your-domain.crt;
    ssl_certificate_key /etc/ssl/private/your-domain.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

    # Main Application
    location / {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # API Rate Limiting
    location /api/auth/ {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health Check
    location /health {
        proxy_pass http://localhost:3000/api/health;
        access_log off;
    }

    # Static Files (if serving from Nginx)
    location /static/ {
        alias /var/www/event-management/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Monitoring (restrict access)
    location /metrics {
        allow 10.0.0.0/8;
        allow 172.16.0.0/12;
        allow 192.168.0.0/16;
        deny all;
        proxy_pass http://localhost:3000/api/metrics;
    }
}
```

### Enable and Start Nginx
```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/event-management /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## 📊 Monitoring Setup

### Deploy Monitoring Stack
```bash
# Deploy monitoring infrastructure
./scripts/deploy-monitoring.sh

# Validate monitoring setup
./scripts/validate-monitoring.sh
```

### Access Monitoring Dashboards
- **Grafana**: https://yourdomain.com:3001 (admin/your_password)
- **Prometheus**: https://yourdomain.com:9090
- **Application Metrics**: https://yourdomain.com/api/metrics

### Configure Alerting
1. **Update Alertmanager configuration** in `monitoring/alertmanager/alertmanager.yml`
2. **Configure notification channels** (Slack, email, PagerDuty)
3. **Test alert routing**:
   ```bash
   # Test Slack integration
   curl -X POST \
     -H 'Content-type: application/json' \
     --data '{"text":"Test alert from Event Management Portal"}' \
     YOUR_SLACK_WEBHOOK_URL
   ```

## 🔍 Post-Deployment Validation

### Health Checks
```bash
# Application health
curl https://yourdomain.com/api/health

# Database connectivity
curl https://yourdomain.com/api/health/ready

# Metrics endpoint
curl https://yourdomain.com/api/metrics
```

### Performance Testing
```bash
# Load testing with Apache Bench
ab -n 1000 -c 10 https://yourdomain.com/api/health

# Or use Artillery (if installed)
artillery quick --count 10 --num 100 https://yourdomain.com/api/health
```

### Security Validation
```bash
# SSL Labs test (external)
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=yourdomain.com

# Security headers check
curl -I https://yourdomain.com

# Rate limiting test
for i in {1..20}; do curl -I https://yourdomain.com/api/health; done
```

## 🔄 Backup and Recovery

### Automated Backup Setup
```bash
# Set up automated backups
crontab -e

# Add these entries:
# Daily database backup at 2 AM
0 2 * * * /path/to/Event-Management-Portal/scripts/backup-monitoring.sh

# Weekly full backup on Sundays at 3 AM
0 3 * * 0 /path/to/Event-Management-Portal/scripts/backup-full.sh
```

### Manual Backup
```bash
# Backup database
mongodump --uri="$MONGODB_URI" --out=backups/$(date +%Y%m%d_%H%M%S)

# Backup application files
tar -czf backups/app-$(date +%Y%m%d_%H%M%S).tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  /path/to/Event-Management-Portal

# Backup monitoring data
./scripts/backup-monitoring.sh
```

## 🔧 Maintenance Tasks

### Daily Tasks
```bash
# Check system health
./scripts/validate-monitoring.sh

# Check logs for errors
docker-compose -f docker-compose.prod.yml logs --tail=100 | grep -i error

# Monitor resource usage
docker stats --no-stream
```

### Weekly Tasks
```bash
# Update Docker images (if needed)
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# Clean up unused Docker resources
docker system prune -f

# Review monitoring alerts and metrics
# (Check Grafana dashboards)
```

### Monthly Tasks
```bash
# Update SSL certificates (if using Let's Encrypt)
sudo certbot renew

# Review and rotate logs
logrotate -f /etc/logrotate.conf

# Security updates
sudo apt update && sudo apt upgrade -y
```

## 🆘 Troubleshooting

### Common Issues and Solutions

#### 1. Application Won't Start
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs backend

# Common causes:
# - Environment variables not set
# - Database connection issues
# - Port conflicts

# Check environment
./scripts/deploy-app.sh validate-env

# Test database connection
./scripts/test-connections.sh
```

#### 2. High Response Times
```bash
# Check application metrics
curl https://yourdomain.com/api/metrics

# Check database performance
# - Review slow queries in MongoDB
# - Check Redis connection

# Check system resources
htop
iotop
```

#### 3. SSL Certificate Issues
```bash
# Check certificate expiration
openssl x509 -in /etc/ssl/certs/your-domain.crt -text -noout | grep "Not After"

# Test SSL configuration
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
```

#### 4. Database Connection Issues
```bash
# Test MongoDB connection
mongosh "$MONGODB_URI" --eval "db.runCommand('ping')"

# Test Redis connection
redis-cli -u "$REDIS_URL" ping
```

### Log Locations
- **Application Logs**: `docker-compose -f docker-compose.prod.yml logs backend`
- **Nginx Logs**: `/var/log/nginx/access.log`, `/var/log/nginx/error.log`
- **System Logs**: `/var/log/syslog`

### Performance Monitoring
- **Grafana Dashboards**: https://yourdomain.com:3001
- **Application Metrics**: https://yourdomain.com/api/metrics
- **System Metrics**: `htop`, `iotop`, `netstat`

## 📞 Support and Escalation

### Emergency Contacts
- **Platform Team**: platform@yourdomain.com
- **On-Call Engineer**: +1-XXX-XXX-XXXX
- **Slack Channel**: #incident-response

### Escalation Procedures
1. **P1 (Critical)**: Page on-call engineer immediately
2. **P2 (High)**: Email platform team, create incident ticket
3. **P3 (Medium)**: Create support ticket for next business day
4. **P4 (Low)**: Document in monitoring channel

### External Resources
- [MongoDB Atlas Support](https://support.mongodb.com/)
- [Cloudinary Support](https://support.cloudinary.com/)
- [Docker Documentation](https://docs.docker.com/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)

---

**Deployment Complete! 🎉**

Your Event Management Portal is now running in production with comprehensive monitoring, security, and backup procedures in place.