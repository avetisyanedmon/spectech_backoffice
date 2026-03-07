# Production Deployment Checklist

Use this checklist to ensure a smooth deployment of SpecTech Backoffice to production with Supabase.

## Pre-Deployment

### 1. Supabase Setup ✓

- [ ] Create Supabase project at https://app.supabase.com
- [ ] Note down project URL and region
- [ ] Generate and save database password securely
- [ ] Wait for project provisioning to complete (~2 minutes)

### 2. Database Migration ✓

- [ ] Open Supabase SQL Editor
- [ ] Copy contents of `supabase-migration.sql`
- [ ] Execute the migration script
- [ ] Verify tables created: `orders`, `equipment`, `bids`
- [ ] Check that indexes are created
- [ ] Verify triggers are working

### 3. API Credentials ✓

- [ ] Get Supabase Project URL from Settings → API
- [ ] Get Service Role Key from Settings → API
- [ ] **Never commit these to Git!**
- [ ] Store in secure password manager

### 4. SMS Configuration ✓

- [ ] Create SMS.ru account at https://sms.ru
- [ ] Add funds to account
- [ ] Get API ID from Settings
- [ ] Create alphabetic sender at https://sms.ru/?panel=senders
- [ ] Wait for sender approval (~24 hours)

### 5. Security Setup ✓

- [ ] Generate strong JWT secret: `openssl rand -base64 32`
- [ ] Generate OTP pepper: `openssl rand -base64 32`
- [ ] Store all secrets securely
- [ ] Review `.env.production.example` for required variables

## Deployment Steps

### Option A: Deploy to Render

1. **Create Web Service**
   - [ ] Go to https://render.com/dashboard
   - [ ] Click "New +" → "Web Service"
   - [ ] Connect your GitHub repository
   - [ ] Select the repository

2. **Configure Service**
   - [ ] Name: `spectech-backoffice`
   - [ ] Root Directory: `spectech_backoffice`
   - [ ] Environment: `Node`
   - [ ] Build Command: `npm install`
   - [ ] Start Command: `npm start`
   - [ ] Instance Type: Free or Starter

3. **Set Environment Variables**
   ```
   USE_SUPABASE=true
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_key
   JWT_SECRET=your_jwt_secret
   SMS_RU_API_ID=your_sms_api_id
   SMS_RU_FROM=SPECTECH
   OTP_HASH_PEPPER=your_pepper
   FRONTEND_ORIGINS=https://your-frontend.vercel.app
   NODE_ENV=production
   ```

4. **Deploy**
   - [ ] Click "Create Web Service"
   - [ ] Wait for deployment to complete
   - [ ] Note down the service URL

### Option B: Deploy to Railway

1. **Create Project**
   - [ ] Go to https://railway.app
   - [ ] Click "New Project"
   - [ ] Select "Deploy from GitHub repo"
   - [ ] Choose your repository

2. **Configure**
   - [ ] Railway auto-detects Node.js
   - [ ] Add environment variables (same as Render)
   - [ ] Set start command: `cd spectech_backoffice && npm start`

3. **Deploy**
   - [ ] Railway automatically deploys
   - [ ] Get the public URL from Settings

### Option C: Deploy to Heroku

1. **Setup**
   ```bash
   heroku login
   heroku create spectech-backoffice
   ```

2. **Set Environment Variables**
   ```bash
   heroku config:set USE_SUPABASE=true
   heroku config:set SUPABASE_URL=https://xxxxx.supabase.co
   heroku config:set SUPABASE_SERVICE_ROLE_KEY=your_key
   heroku config:set JWT_SECRET=your_jwt_secret
   heroku config:set SMS_RU_API_ID=your_sms_api_id
   heroku config:set SMS_RU_FROM=SPECTECH
   heroku config:set NODE_ENV=production
   ```

3. **Deploy**
   ```bash
   git subtree push --prefix spectech_backoffice heroku main
   ```

## Post-Deployment Verification

### 1. Health Check ✓

```bash
# Replace with your actual URL
curl https://your-app.onrender.com/api/health

# Expected: 200 OK
```

### 2. Test Authentication Flow ✓

```bash
# Start OTP
curl -X POST https://your-app.onrender.com/api/auth/start \
  -H "Content-Type: application/json" \
  -d '{"phone": "+79990000000"}'

# Expected: {"success": true, "requestId": "..."}
```

### 3. Check Supabase Logs ✓

- [ ] Go to Supabase Dashboard → Logs → Database
- [ ] Verify queries are being executed
- [ ] Check for any errors

### 4. Test API Endpoints ✓

- [ ] Test GET /api/orders (requires auth)
- [ ] Test POST /api/orders (requires auth)
- [ ] Test POST /api/equipment (requires auth)
- [ ] Verify CORS is working from frontend

### 5. Monitor Performance ✓

- [ ] Check Supabase Reports → API requests
- [ ] Monitor database connections
- [ ] Check response times
- [ ] Verify no errors in logs

## Frontend Configuration

### Update Frontend Environment

Update your frontend `.env` or `.env.production`:

```bash
VITE_API_BASE_URL=https://your-backend.onrender.com
VITE_API_URL=https://your-backend.onrender.com
```

### Redeploy Frontend

- [ ] Update environment variables in Vercel/Netlify
- [ ] Trigger new deployment
- [ ] Test end-to-end flow

## Security Checklist

### Environment Variables ✓

- [ ] All secrets are set as environment variables
- [ ] No secrets in code or Git history
- [ ] `.env` is in `.gitignore`
- [ ] Service Role Key is never exposed to frontend

### CORS Configuration ✓

- [ ] `FRONTEND_ORIGINS` includes only trusted domains
- [ ] No wildcard (`*`) in production
- [ ] HTTPS enforced for all origins

### Database Security ✓

- [ ] Supabase Service Role Key is secure
- [ ] Database password is strong
- [ ] Consider enabling Row Level Security (RLS)
- [ ] Regular backups are enabled

### API Security ✓

- [ ] JWT secret is strong (32+ characters)
- [ ] OTP codes expire after use
- [ ] Rate limiting considered for auth endpoints
- [ ] Input validation on all endpoints

## Monitoring Setup

### Supabase Monitoring ✓

- [ ] Enable email alerts for high CPU usage
- [ ] Set up alerts for connection pool exhaustion
- [ ] Monitor storage usage
- [ ] Review slow query logs weekly

### Application Monitoring ✓

- [ ] Set up uptime monitoring (e.g., UptimeRobot)
- [ ] Configure error tracking (e.g., Sentry)
- [ ] Set up log aggregation
- [ ] Monitor API response times

### Backup Strategy ✓

- [ ] Verify Supabase automatic daily backups
- [ ] Test backup restoration process
- [ ] Document backup retention policy
- [ ] Set up manual backup schedule if needed

## Rollback Plan

### If Deployment Fails ✓

1. **Check Logs**
   - [ ] Review deployment logs
   - [ ] Check Supabase logs
   - [ ] Verify environment variables

2. **Common Issues**
   - [ ] Missing environment variables
   - [ ] Incorrect Supabase credentials
   - [ ] CORS misconfiguration
   - [ ] Database migration not run

3. **Rollback Steps**
   - [ ] Revert to previous deployment
   - [ ] Switch `USE_SUPABASE=false` temporarily
   - [ ] Fix issues and redeploy

## Maintenance

### Regular Tasks ✓

- [ ] **Weekly**: Review error logs
- [ ] **Weekly**: Check API performance metrics
- [ ] **Monthly**: Review and optimize slow queries
- [ ] **Monthly**: Check Supabase storage usage
- [ ] **Quarterly**: Rotate API keys and secrets
- [ ] **Quarterly**: Review and update dependencies

### Scaling Considerations ✓

- [ ] Monitor database connections (max 15 on free tier)
- [ ] Consider connection pooling if needed
- [ ] Upgrade Supabase plan if approaching limits
- [ ] Add Redis for OTP storage at scale

## Documentation

### Update Documentation ✓

- [ ] Document production URL
- [ ] Update API documentation
- [ ] Document any custom configurations
- [ ] Share credentials securely with team

### Team Communication ✓

- [ ] Notify team of deployment
- [ ] Share production URL
- [ ] Document any breaking changes
- [ ] Schedule post-deployment review

## Success Criteria

Deployment is successful when:

- ✅ API is accessible at production URL
- ✅ Authentication flow works end-to-end
- ✅ Database operations are successful
- ✅ Frontend can communicate with backend
- ✅ No errors in logs
- ✅ Response times are acceptable (<500ms)
- ✅ All test accounts work
- ✅ SMS delivery is working

## Support

If you encounter issues:

1. Check [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
2. Review [README.md](./README.md)
3. Check Supabase documentation
4. Contact development team

---

**Last Updated**: March 2026  
**Version**: 1.0.0
