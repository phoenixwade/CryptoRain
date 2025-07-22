# Crypto Rain Installation Guide

Complete installation instructions for deploying the Crypto Rain web application on any domain with WHM/cPanel server setup.

## Prerequisites

- **Server Access**: WHM/cPanel access with domain management capabilities
- **Domain Setup**: Valid domain with SSL certificate configured
- **Node.js**: Version 16+ installed on server
- **Python**: Version 3.6+ for development server (optional)
- **XPR Account**: For blockchain integration testing

## Repository Structure

```
CryptoRain/
├── .env                    # Environment configuration (create from template)
├── public_html/           # Web application files (deploy to document root)
│   ├── config.js         # Frontend configuration
│   ├── index.html        # Main game page
│   ├── game.js          # Game logic
│   ├── manifest.json    # PWA manifest
│   ├── server.py        # Development server
│   ├── icon-192.png     # PWA icon
│   ├── icon-512.png     # PWA icon
│   └── api/             # Backend API server
│       ├── server.ts    # API server
│       ├── package.json # Dependencies
│       └── tsconfig.json
├── smart-contract/       # XPR blockchain contract
└── INSTALLATION.md      # This file
```

## Step 1: Environment Configuration

### 1.1 Create Environment File

Copy the `.env` file to your deployment location and customize for your domain:

```bash
# Copy template
cp .env .env.production

# Edit for your domain
nano .env.production
```

### 1.2 Configure Domain Variables

Update the following variables in your `.env` file:

```env
# Domain Configuration
DOMAIN=yourdomain.com
API_URL=https://yourdomain.com/api
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,http://localhost:8080

# XPR Blockchain Configuration
PROTON_ENDPOINTS=https://proton-testnet.greymass.com
SMART_CONTRACT_ACCOUNT=gamecontract
APP_NAME=CryptoRain

# Image Configuration
PLACEHOLDER_IMAGE_BASE=https://via.placeholder.com/800x600/1a1a2e/ffffff?text=

# Server Configuration
PORT=3000
DEV_PORT=8080
```

### 1.3 Configure Frontend Variables

Update `public_html/config.js` to match your domain:

```javascript
window.CryptoRainConfig = {
    DOMAIN: 'yourdomain.com',
    API_URL: 'https://yourdomain.com/api',
    PROTON_ENDPOINTS: ['https://proton-testnet.greymass.com'],
    SMART_CONTRACT_ACCOUNT: 'gamecontract',
    APP_NAME: 'CryptoRain',
    PLACEHOLDER_IMAGE_BASE: 'https://via.placeholder.com/800x600/1a1a2e/ffffff?text=',
    DEV_PORT: 8080
};
```

## Step 2: Backend API Deployment

### 2.1 Create API Directory

In your cPanel File Manager or via SSH:

```bash
# Navigate to your domain's document root
cd /home/username/public_html/

# Create API directory
mkdir -p api
cd api
```

### 2.2 Upload Backend Files

Upload the contents of `public_html/api/` to your server's `public_html/api/` directory:

- `server.ts`
- `package.json`
- `tsconfig.json`

### 2.3 Install Dependencies

```bash
cd /home/username/public_html/api/
npm install
```

### 2.4 Build TypeScript

```bash
npm run build
```

### 2.5 Start API Server

Using PM2 (recommended for production):

```bash
# Install PM2 globally
npm install -g pm2

# Start the API server
pm2 start dist/server.js --name crypto-rain-api

# Save PM2 configuration
pm2 save
pm2 startup
```

Alternative using Node.js directly:

```bash
# Start server in background
nohup node dist/server.js > api.log 2>&1 &
```

### 2.6 Configure Reverse Proxy (Optional)

If using Apache, create `.htaccess` in `public_html/api/`:

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
```

## Step 3: Frontend Web Application Deployment

### 3.1 Upload Frontend Files

Upload the contents of `public_html/` (excluding `api/` directory) to your domain's document root:

```bash
# Upload these files to /home/username/public_html/
- index.html
- game.js
- config.js
- manifest.json
- server.py
- icon-192.png
- icon-512.png
```

### 3.2 Set File Permissions

```bash
# Set proper permissions
chmod 644 /home/cryptokaraoke/public_html/*.html
chmod 644 /home/cryptokaraoke/public_html/*.js
chmod 644 /home/cryptokaraoke/public_html/*.json
chmod 644 /home/cryptokaraoke/public_html/*.png
chmod 755 /home/cryptokaraoke/public_html/api/
```

### 3.3 Configure HTTPS

Ensure your domain has a valid SSL certificate:

1. In cPanel, go to "SSL/TLS"
2. Enable "Force HTTPS Redirect"
3. Verify certificate is valid for your domain

## Step 4: XPR Blockchain Integration

### 4.1 Smart Contract Deployment

#### Prerequisites
- XPR testnet account
- Proton CLI installed locally
- TypeScript to WASM compiler: `proton-asc` (included with proton-tsc)

#### Deploy Contract

```bash
# Install Proton CLI
npm install -g @proton/cli

# Configure Proton CLI for testnet
npx @proton/cli chain:set proton-test
npx @proton/cli chain:get  # Verify chain is set correctly

# Add your wsaffiliate private key (XPR format, not GitHub token)
npx @proton/cli key:add YOUR_WSAFFILIATE_PRIVATE_KEY
# Choose "no" when asked about password encryption
npx @proton/cli key:list  # Verify key is stored

# Navigate to smart contract directory
cd smart-contract/

# Compile TypeScript contract to WASM
npx proton-asc gamecontract.contract.ts
# This generates target/gamecontract.contract.wasm and target/gamecontract.contract.abi

# Deploy to XPR testnet using wsaffiliate account
npx @proton/cli contract:set wsaffiliate ./target

# Verify deployment by checking contract on XPR block explorer
```

#### Troubleshooting

**Chain Configuration Issues:**
- Use `proton-test` (not `testnet`) for XPR testnet
- Verify with `npx @proton/cli chain:list` to see available chains

**Compilation Errors:**
- Ensure all imports use correct proton-tsc exports
- Use `u8[]` instead of `Vector<u8>` for array parameters  
- Use `currentBlockNum()` instead of `currentBlockTime()`
- Types like `u8`, `u64`, `usize`, `i32` are built-in AssemblyScript types
- Use `sizeof<T>()` for size calculations (built-in AssemblyScript function)
- Use `packNumberArray<T>()` and `unpackNumberArray<T>()` for array serialization
- Remove duplicate action classes if auto-generated multiple times

**Deployment Failures:**
- Verify account has sufficient RAM and CPU resources
- Check that private key corresponds to the deployment account
- Ensure WASM and ABI files exist in target directory

**Key Format Error:**
If you get "invalid base-58 value" error, ensure you're using the XPR private key for wsaffiliate account, not a GitHub or other token. The private key should be in base-58 format starting with "5" and be approximately 51 characters long.

**Missing Private Key:**
The wsaffiliate account private key is required for deployment. This should be obtained from the XPR testnet account creation process, not from GitHub tokens or other sources.

### 4.2 XPR Webauth Configuration

1. **Register Application**: Visit XPR developer portal
2. **Get Client ID**: Create application for your domain
3. **Configure Origins**: Add your domain to allowed origins
4. **Update Config**: Add client ID to your configuration

### 4.3 Production Configuration

For mainnet deployment:

```env
# Update .env for mainnet
PROTON_ENDPOINTS=https://proton.greymass.com
```

```javascript
// Update config.js for mainnet
PROTON_ENDPOINTS: ['https://proton.greymass.com'],
```

## Step 5: Testing and Verification

### 5.1 Backend API Testing

Test API endpoints:

```bash
# Test leaderboard endpoint
curl https://yourdomain.com/api/leaderboard

# Test CORS headers
curl -H "Origin: https://yourdomain.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://yourdomain.com/api/submit-score
```

### 5.2 Frontend Testing

1. **Open Game**: Visit `https://yourdomain.com`
2. **Test Login**: Click "Login with XPR" button
3. **Test Gameplay**: Start game and collect tokens
4. **Test Leaderboard**: Submit score and verify leaderboard updates
5. **Test PWA**: Install app on mobile device

### 5.3 XPR Integration Testing

1. **Webauth Login**: Verify XPR wallet connection
2. **Smart Contract**: Test startgame action (cooldown check)
3. **Token Claims**: Test claimmulti action
4. **Blockchain Verification**: Check transactions on XPR explorer

## Step 6: Production Optimization

### 6.1 Performance Configuration

#### Enable Compression

Add to `.htaccess` in document root:

```apache
# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>
```

#### Cache Headers

```apache
# Cache static assets
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 week"
    ExpiresByType text/css "access plus 1 week"
</IfModule>
```

### 6.2 Security Configuration

#### API Rate Limiting

Consider implementing rate limiting in your API server:

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

#### CORS Security

Ensure CORS origins are properly configured for production:

```env
# Production CORS - remove localhost
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

## Troubleshooting

### Common Issues

#### 1. API Connection Failed

**Symptoms**: Game shows "API connection failed" error

**Solutions**:
- Verify API server is running: `pm2 status`
- Check API logs: `pm2 logs crypto-rain-api`
- Test API endpoint directly: `curl https://yourdomain.com/api/leaderboard`
- Verify CORS configuration matches frontend domain

#### 2. XPR Webauth Not Working

**Symptoms**: Login button doesn't work or shows errors

**Solutions**:
- Verify HTTPS is enabled (required for webauth)
- Check browser console for errors
- Verify XPR client ID is configured correctly
- Test with different browsers
- Check XPR developer portal configuration

#### 3. Game Assets Not Loading

**Symptoms**: Missing images or broken layout

**Solutions**:
- Verify all files uploaded correctly
- Check file permissions (644 for files, 755 for directories)
- Test image URLs directly in browser
- Check browser console for 404 errors

#### 4. Smart Contract Errors

**Symptoms**: Transaction failures or blockchain errors

**Solutions**:
- Verify smart contract is deployed correctly
- Check XPR account has sufficient resources
- Test with XPR testnet first
- Verify contract account name matches configuration

### Log Files

Monitor these log files for issues:

- **API Server**: `pm2 logs crypto-rain-api`
- **Apache Error**: `/var/log/apache2/error.log`
- **Apache Access**: `/var/log/apache2/access.log`
- **Browser Console**: F12 Developer Tools

### Support Resources

- **XPR Documentation**: https://docs.protonchain.com/
- **Node.js Deployment**: https://nodejs.org/en/docs/guides/
- **cPanel Documentation**: Your hosting provider's knowledge base

## Maintenance

### Regular Tasks

1. **Update Dependencies**: Run `npm update` monthly
2. **Monitor Logs**: Check for errors and performance issues
3. **Backup Configuration**: Keep copies of `.env` and `config.js`
4. **SSL Certificate**: Ensure certificate doesn't expire
5. **XPR Resources**: Monitor blockchain resource usage

### Updates

When updating the game:

1. **Backup Current**: Create backup of working installation
2. **Test Locally**: Test changes in development environment
3. **Deploy Gradually**: Update backend first, then frontend
4. **Verify Functionality**: Test all features after deployment
5. **Monitor**: Watch logs for any issues after deployment

---

## Quick Start Checklist

- [ ] Domain configured with SSL certificate
- [ ] `.env` file created and customized for your domain
- [ ] `config.js` updated with your domain settings
- [ ] Backend API deployed and running
- [ ] Frontend files uploaded to document root
- [ ] XPR smart contract deployed (if using blockchain features)
- [ ] All endpoints tested and working
- [ ] Game tested end-to-end
- [ ] PWA installation tested
- [ ] Performance optimization applied
- [ ] Monitoring and logging configured

For additional support or questions, refer to the project repository or contact the development team.
