# POS System Deployment Configuration

## Environment Variables

### Production Build
```bash
# Create production build
npm run build

# Serve static files
npm run preview
```

### Environment Configuration
Create `.env.production` file:
```
VITE_APP_NAME=Modern POS System
VITE_APP_VERSION=1.2.0
VITE_API_BASE_URL=https://your-api.com
VITE_ENABLE_PWA=true
VITE_ENABLE_ANALYTICS=true
VITE_SUPPORT_EMAIL=support@yourpos.com
VITE_COMPANY_NAME=Your Company
```

## Static Hosting Deployment

### Netlify Deployment
1. Create `netlify.toml`:
```toml
[build]
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"

[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "no-cache"

[[headers]]
  for = "/manifest.json"
  [headers.values]
    Cache-Control = "public, max-age=3600"

[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000"
```

2. Deploy commands:
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy to production
netlify deploy --prod --dir=dist
```

### Vercel Deployment
1. Create `vercel.json`:
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": null,
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-cache"
        }
      ]
    },
    {
      "source": "/manifest.json",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=3600"
        }
      ]
    },
    {
      "source": "/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000"
        }
      ]
    }
  ]
}
```

2. Deploy commands:
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to production
vercel --prod
```

### GitHub Pages Deployment
1. Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          VITE_APP_BASE_URL: /your-repo-name/
      
      - name: Setup Pages
        uses: actions/configure-pages@v3
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v2
        with:
          path: './dist'
  
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v2
```

## Self-Hosted Deployment

### Docker Deployment
1. Create `Dockerfile`:
```dockerfile
# Build stage
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

2. Create `nginx.conf`:
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Service Worker - no cache
    location /sw.js {
        add_header Cache-Control "no-cache";
        expires 0;
    }

    # Manifest
    location /manifest.json {
        expires 1h;
        add_header Cache-Control "public";
    }

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self';";
}
```

3. Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  pos-system:
    build: .
    ports:
      - "80:80"
    restart: unless-stopped
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
    environment:
      - NODE_ENV=production
```

4. Deploy commands:
```bash
# Build and run with Docker
docker build -t pos-system .
docker run -p 80:80 pos-system

# Or use Docker Compose
docker-compose up -d
```

### Traditional Web Server (Apache/Nginx)

#### Apache Configuration (`.htaccess`):
```apache
RewriteEngine On
RewriteBase /

# Handle client-side routing
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Cache control
<FilesMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg)$">
    Header set Cache-Control "public, max-age=31536000"
</FilesMatch>

<Files "sw.js">
    Header set Cache-Control "no-cache"
</Files>

<Files "manifest.json">
    Header set Cache-Control "public, max-age=3600"
</Files>

# Security headers
Header always set X-Frame-Options DENY
Header always set X-Content-Type-Options nosniff
Header always set X-XSS-Protection "1; mode=block"
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
```

## Database Backup Strategy

### Automated Backups
```javascript
// Schedule daily backups
import { backupService } from './services/backupService';

// Auto backup every 24 hours
backupService.scheduleAutoBackup(24);

// Export backup for external storage
const exportBackup = async () => {
  const backup = await backupService.createBackup();
  // Send to cloud storage, email, etc.
};
```

### Manual Backup Commands
```bash
# Create backup file
npm run backup

# Restore from backup
npm run restore -- --file=backup.json

# Clear database
npm run db:clear
```

## SSL Certificate Setup

### Let's Encrypt (Certbot)
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### CloudFlare SSL (Free)
1. Add domain to CloudFlare
2. Update nameservers
3. Enable "Full (strict)" SSL mode
4. Enable "Always Use HTTPS"
5. Enable "HSTS"

## Performance Optimization

### Build Optimization
```javascript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['dexie', 'date-fns']
        }
      }
    },
    minify: 'esbuild',
    sourcemap: false,
    cssMinify: true
  }
});
```

### Service Worker Optimization
- Cache static assets
- Implement background sync
- Enable offline functionality
- Handle updates gracefully

## Monitoring and Analytics

### Error Tracking
```javascript
// Add error tracking (Sentry, LogRocket, etc.)
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: "production"
});
```

### Usage Analytics
```javascript
// Google Analytics 4
gtag('config', 'GA_MEASUREMENT_ID');

// Custom events
gtag('event', 'purchase', {
  transaction_id: '12345',
  value: 25.42,
  currency: 'USD'
});
```

## Security Checklist

- [ ] HTTPS enabled
- [ ] Content Security Policy configured
- [ ] Security headers set
- [ ] Input validation implemented
- [ ] XSS protection enabled
- [ ] CSRF protection (if applicable)
- [ ] Regular security updates
- [ ] Database encryption (if applicable)
- [ ] User authentication secured
- [ ] API rate limiting (if applicable)

## Maintenance

### Regular Tasks
- Database backups (automated)
- Security updates
- Performance monitoring
- Error log review
- User feedback collection

### Update Procedure
1. Create database backup
2. Deploy to staging
3. Run tests
4. Deploy to production
5. Monitor for issues
6. Rollback if needed

## Customer Deployment

### White-label Configuration
```javascript
// Brand customization
const brandConfig = {
  name: "Customer POS System",
  logo: "/customer-logo.png",
  colors: {
    primary: "#1f2937",
    secondary: "#3b82f6"
  },
  features: {
    multiStore: true,
    advancedReports: true,
    loyaltyProgram: true
  }
};
```

### Multi-tenant Setup
- Separate database per customer
- Custom domain mapping
- Isolated data storage
- Individual backups
- Custom branding per tenant

## Support and Documentation

### Customer Support
- Setup documentation
- Video tutorials
- FAQ section
- Support ticket system
- Remote assistance capability

### Training Materials
- User manual
- Quick start guide
- Feature documentation
- Best practices guide
- Troubleshooting guide
