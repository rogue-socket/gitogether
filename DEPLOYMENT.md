# 🚀 Deployment Guide

Complete guide to deploying GitTogether in production environments.

## Prerequisites

- Docker & Docker Compose installed
- PostgreSQL 14+ (or use managed service)
- Node.js 20+
- GitHub OAuth app credentials
- Domain name with DNS configured
- SSL/TLS certificate (or use Let's Encrypt)

## 📋 Environment Setup

### Create .env.production

```bash
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Database
DATABASE_URL=postgresql://user:password@host:5432/gitogether_prod

# GitHub OAuth
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
GITHUB_WEBHOOK_SECRET=your_webhook_secret

# Session
SESSION_SECRET=generate_with_openssl_rand_base64_32

# Redis (optional, for caching)
REDIS_URL=redis://redis:6379

# Email (optional)
SENDGRID_API_KEY=your_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Analytics (optional)
SENTRY_DSN=your_sentry_dsn
```

### Generate Secrets

```bash
# Generate secure session secret
openssl rand -base64 32

# Generate GitHub webhook secret
openssl rand -hex 32
```

## 🐳 Docker Deployment

### Build Docker Image

```bash
docker build -t gitogether:latest .

# Tag for registry
docker tag gitogether:latest your-registry/gitogether:latest
docker push your-registry/gitogether:latest
```

### Docker Compose (Single Server)

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  api:
    image: your-registry/gitogether:latest
    container_name: gitogether-api
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://gitogether:${DB_PASSWORD}@postgres:5432/gitogether_prod
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    volumes:
      - ./logs:/app/logs

  postgres:
    image: postgres:15-alpine
    container_name: gitogether-db
    environment:
      - POSTGRES_USER=gitogether
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=gitogether_prod
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    restart: always
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U gitogether"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: gitogether-cache
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    restart: always
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

volumes:
  postgres_data:
  redis_data:

networks:
  default:
    name: gitogether-network
```

Deploy:

```bash
# Set secure password
export DB_PASSWORD=$(openssl rand -base64 32)

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Run migrations
docker exec gitogether-api npm run db:migrate

# Verify health
docker-compose -f docker-compose.prod.yml ps
```

## 🔒 SSL/TLS Configuration

### Using Let's Encrypt with Certbot

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Auto-renew
sudo systemctl enable certbot.timer
```

### Nginx Reverse Proxy Configuration

Create `/etc/nginx/sites-available/gitogether`:

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS Configuration
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Certificates
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # Proxy to Node.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/gitogether /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 🗄️ Database Migrations

### First Run

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed initial data (optional)
npm run db:seed
```

### Ongoing Migrations

```bash
# After schema changes
npx prisma migrate dev --name add_new_field

# Apply to production
npx prisma migrate deploy
```

## 📊 Backup Strategy

### Automated Daily Backups

Create backup script `/usr/local/bin/backup-gitogether.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/backups/gitogether"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="gitogether_prod"
DB_USER="gitogether"

mkdir -p $BACKUP_DIR

# PostgreSQL backup
PGPASSWORD=$DB_PASSWORD pg_dump -h localhost -U $DB_USER $DB_NAME | \
    gzip > $BACKUP_DIR/db_$TIMESTAMP.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR/db_$TIMESTAMP.sql.gz"
```

Schedule with cron:

```bash
# Run daily at 2 AM
0 2 * * * /usr/local/bin/backup-gitogether.sh
```

### Restore from Backup

```bash
# List backups
ls -lh /backups/gitogether/

# Restore
gunzip < /backups/gitogether/db_20240524_020000.sql.gz | \
    PGPASSWORD=$DB_PASSWORD psql -h localhost -U gitogether gitogether_prod
```

## 📈 Monitoring & Logging

### Application Logs

```bash
# View logs
docker logs gitogether-api

# Tail logs
docker logs -f gitogether-api

# Save logs to file
docker logs gitogether-api > /var/log/gitogether.log 2>&1
```

### Health Checks

```bash
# Endpoint
curl https://yourdomain.com/api/health

# Response
{
  "status": "ok",
  "database": "connected",
  "redis": "connected",
  "uptime": 3600
}
```

### Monitoring Tools

Install Prometheus + Grafana:

```bash
docker run -d \
  --name prometheus \
  -p 9090:9090 \
  -v /etc/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus

docker run -d \
  --name grafana \
  -p 3001:3000 \
  -e GF_SECURITY_ADMIN_PASSWORD=admin \
  grafana/grafana
```

## 🔄 Continuous Deployment

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build Docker image
        run: docker build -t your-registry/gitogether:${{ github.sha }} .

      - name: Push to registry
        run: docker push your-registry/gitogether:${{ github.sha }}

      - name: Deploy
        run: |
          ssh -i ${{ secrets.DEPLOY_KEY }} \
              ${{ secrets.DEPLOY_USER }}@${{ secrets.DEPLOY_HOST }} \
              'docker pull your-registry/gitogether:${{ github.sha }} && \
               docker-compose up -d'
```

## 🆘 Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL status
docker exec gitogether-db pg_isready -U gitogether

# Check connection string in .env.production
psql postgresql://gitogether:password@localhost:5432/gitogether_prod -c "SELECT 1"
```

### High Memory Usage

```bash
# Check container stats
docker stats gitogether-api

# If needed, increase memory limit in docker-compose.yml
# deploy:
#   resources:
#     limits:
#       memory: 2G
```

### Slow Queries

```bash
# Enable query logging in PostgreSQL
docker exec gitogether-db psql -U gitogether -d gitogether_prod -c \
    "ALTER DATABASE gitogether_prod SET log_min_duration_statement = 1000;"
```

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/rogue-socket/gitogether/issues)
- **Discussions**: [GitHub Discussions](https://github.com/rogue-socket/gitogether/discussions)
- **Discord**: [Community server](#)
