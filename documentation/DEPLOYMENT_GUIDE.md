# Deployment Guide

## Overview

This guide covers deploying the Event Management Portal application to production environments, including server setup, configuration, and best practices.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Requirements](#server-requirements)
3. [Deployment Methods](#deployment-methods)
4. [Production Configuration](#production-configuration)
5. [SSL/HTTPS Setup](#sslhttps-setup)
6. [Environment Setup](#environment-setup)
7. [Database Deployment](#database-deployment)
8. [Monitoring and Logging](#monitoring-and-logging)
9. [Backup and Recovery](#backup-and-recovery)
10. [CI/CD Pipeline](#cicd-pipeline)

---

## Prerequisites

Before deploying, ensure you have:

- ✅ Node.js 14+ installed on production server
- ✅ MongoDB database (local or Atlas)
- ✅ Domain name and DNS configuration
- ✅ SSL certificate (Let's Encrypt recommended)
- ✅ Server with adequate resources
- ✅ Third-party service accounts (Cloudinary, Google OAuth)

---

## Server Requirements

### Minimum Requirements

| Resource  | Minimum  | Recommended |
| --------- | -------- | ----------- |
| CPU       | 1 vCPU   | 2+ vCPU     |
| RAM       | 1 GB     | 2+ GB       |
| Storage   | 10 GB    | 20+ GB      |
| Bandwidth | 100 Mbps | 1 Gbps      |

### Supported Platforms

- **Cloud Providers**: AWS, Google Cloud, Azure, DigitalOcean
- **VPS Providers**: Linode, Vultr, Hetzner
- **Platform-as-a-Service**: Heroku, Railway, Render
- **Traditional Hosting**: Any VPS with Node.js support

---

## Deployment Methods

### Method 1: Traditional VPS Deployment

#### 1. Server Setup

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB (if hosting locally)
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx for reverse proxy
sudo apt install nginx -y
```

#### 2. Application Deployment

```bash
# Clone repository
git clone https://github.com/yourusername/event-management-portal.git
cd event-management-portal

# Install dependencies
npm install

# Build CSS (if required)
npm run build:css

# Set up environment variables
cp .env.example .env
# Edit .env with production values

# Test the application
npm test

# Start with PM2
pm2 start app.js --name "event-portal"
pm2 startup
pm2 save
```

#### 3. Nginx Configuration

```nginx
# /etc/nginx/sites-available/event-portal
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL Security Headers
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: ws: wss: data: blob: 'unsafe-inline'; frame-ancestors 'self';" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=login:10m rate=10r/m;
    limit_req_zone $binary_remote_addr zone=api:10m rate=60r/m;

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

    # Rate limit auth endpoints
    location /auth/ {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files with caching
    location /css/ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /javascript/ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /images/ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/event-portal /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Method 2: Docker Deployment

#### 1. Create Dockerfile

```dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Build CSS
RUN npm run build:css

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Start application
CMD ["npm", "start"]
```

#### 2. Docker Compose Configuration

```yaml
# docker-compose.yml
version: "3.8"

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    depends_on:
      - mongodb
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs

  mongodb:
    image: mongo:6.0
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
      MONGO_INITDB_DATABASE: ${MONGO_DB_NAME}
    volumes:
      - mongodb_data:/data/db
      - ./scripts/mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  mongodb_data:
```

#### 3. Build and Deploy

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Scale application (if needed)
docker-compose up -d --scale app=3
```

### Method 3: Platform-as-a-Service (Heroku)

#### 1. Prepare for Heroku

```json
// Add to package.json
{
  "scripts": {
    "start": "node app.js",
    "heroku-postbuild": "npm run build:css"
  },
  "engines": {
    "node": "18.x"
  }
}
```

#### 2. Create Procfile

```
web: npm start
```

#### 3. Deploy to Heroku

```bash
# Install Heroku CLI
# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGO_URI="your_mongodb_atlas_uri"
heroku config:set JWT_SECRET="your_jwt_secret"
# ... set all other environment variables

# Deploy
git push heroku main

# Scale dynos
heroku ps:scale web=1

# View logs
heroku logs --tail
```

---

## Production Configuration

### Environment Variables

```env
# Production .env
NODE_ENV=production
PORT=3000

# Database
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/event-management-prod

# Security
JWT_SECRET=super_secure_jwt_secret_32_characters_minimum
SESSION_SECRET=super_secure_session_secret_32_characters_minimum

# Email
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASS=production_email_password

# OAuth
GOOGLE_CLIENT_ID=prod_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=prod_client_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=prod_cloud_name
CLOUDINARY_API_KEY=prod_api_key
CLOUDINARY_API_SECRET=prod_api_secret

# Optional: Remove debug in production
# DEBUG=
```

### Security Hardening

#### 1. Application Security

```javascript
// In app.js - Add security middleware
import helmet from "helmet";
import rateLimit from "express-rate-limit";

// Helmet for security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
        fontSrc: ["'self'", "fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "res.cloudinary.com"],
        scriptSrc: ["'self'"],
      },
    },
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Stronger rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
});
app.use("/auth", authLimiter);
```

#### 2. Database Security

```javascript
// mongoose-connect.js - Production security
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferMaxEntries: 0,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
};
```

---

## SSL/HTTPS Setup

### Using Let's Encrypt (Certbot)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Manual SSL Certificate

```bash
# If you have your own SSL certificate
sudo mkdir -p /etc/nginx/ssl
sudo cp your-certificate.crt /etc/nginx/ssl/
sudo cp your-private-key.key /etc/nginx/ssl/
sudo chmod 600 /etc/nginx/ssl/*
```

---

## Environment Setup

### System Services

#### 1. Create systemd service (alternative to PM2)

```ini
# /etc/systemd/system/event-portal.service
[Unit]
Description=Event Management Portal
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/event-management-portal
ExecStart=/usr/bin/node app.js
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=event-portal
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl enable event-portal
sudo systemctl start event-portal
sudo systemctl status event-portal
```

#### 2. Log Rotation

```bash
# /etc/logrotate.d/event-portal
/var/log/event-portal/*.log {
    daily
    missingok
    rotate 52
    compress
    notifempty
    create 0644 www-data www-data
    postrotate
        systemctl reload event-portal
    endscript
}
```

---

## Database Deployment

### MongoDB Atlas (Recommended)

1. **Create Cluster**:

   - Go to [MongoDB Atlas](https://cloud.mongodb.com/)
   - Create new project and cluster
   - Choose appropriate tier

2. **Security Setup**:

   - Create database user
   - Configure IP whitelist
   - Enable authentication

3. **Connection**:
   ```env
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/event-management?retryWrites=true&w=majority
   ```

### Self-Hosted MongoDB

```bash
# Install MongoDB
sudo apt-get install mongodb-org

# Configure MongoDB
sudo nano /etc/mongod.conf

# Add authentication
security:
  authorization: enabled

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Create admin user
mongo
use admin
db.createUser({
  user: "admin",
  pwd: "secure_password",
  roles: ["userAdminAnyDatabase"]
})

# Create application user
use event-management
db.createUser({
  user: "app_user",
  pwd: "app_password",
  roles: ["readWrite"]
})
```

---

## Monitoring and Logging

### Application Monitoring

#### 1. PM2 Monitoring

```bash
# Monitor processes
pm2 monit

# View logs
pm2 logs

# Restart application
pm2 restart event-portal

# Update application
git pull
npm install
pm2 restart event-portal
```

#### 2. Custom Health Check

```javascript
// Add to app.js
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});
```

### Logging Setup

```javascript
// Enhanced logging for production
import winston from "winston";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "event-portal" },
  transports: [
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}
```

---

## Backup and Recovery

### Database Backup

```bash
#!/bin/bash
# backup-script.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mongodb"
MONGO_URI="your_mongodb_uri"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
mongodump --uri="$MONGO_URI" --out="$BACKUP_DIR/backup_$DATE"

# Compress backup
tar -czf "$BACKUP_DIR/backup_$DATE.tar.gz" -C "$BACKUP_DIR" "backup_$DATE"

# Remove uncompressed backup
rm -rf "$BACKUP_DIR/backup_$DATE"

# Keep only last 7 backups
find $BACKUP_DIR -name "backup_*.tar.gz" -type f -mtime +7 -delete

echo "Backup completed: backup_$DATE.tar.gz"
```

### Automated Backup

```bash
# Add to crontab
crontab -e

# Daily backup at 2 AM
0 2 * * * /path/to/backup-script.sh
```

### Recovery Procedure

```bash
# Restore from backup
mongorestore --uri="$MONGO_URI" --drop /path/to/backup/directory
```

---

## CI/CD Pipeline

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"
      - run: npm ci
      - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v3

      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /var/www/event-management-portal
            git pull origin main
            npm ci --only=production
            npm run build:css
            pm2 restart event-portal
```

### Deployment Checklist

- [ ] Environment variables configured
- [ ] Database connection tested
- [ ] SSL certificate installed
- [ ] Nginx configuration active
- [ ] Application running and accessible
- [ ] Email functionality tested
- [ ] File uploads working
- [ ] Backup system configured
- [ ] Monitoring enabled
- [ ] Security headers configured
- [ ] Performance optimized

---

## Post-Deployment Tasks

1. **Test All Features**:

   - User registration and login
   - Event creation and registration
   - File uploads
   - Email notifications
   - Admin functions

2. **Performance Optimization**:

   - Enable gzip compression
   - Configure CDN if needed
   - Optimize images
   - Database indexing

3. **Security Audit**:

   - Run security scans
   - Check for vulnerabilities
   - Review access logs
   - Test rate limiting

4. **Documentation**:
   - Update deployment records
   - Document any customizations
   - Create incident response plan

---

**Need Help?** Check the [Troubleshooting Guide](TROUBLESHOOTING.md) or contact the development team.
