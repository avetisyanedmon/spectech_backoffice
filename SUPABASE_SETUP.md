# Supabase Setup Guide for SpecTech Backoffice

This guide will help you set up Supabase as the production database for the SpecTech Backoffice backend.

## Prerequisites

- A Supabase account (sign up at https://supabase.com)
- Node.js installed locally for testing

## Step 1: Create a Supabase Project

1. Go to https://app.supabase.com
2. Click **"New Project"**
3. Fill in the project details:
   - **Name**: `spectech-backoffice` (or your preferred name)
   - **Database Password**: Generate a strong password and save it securely
   - **Region**: Choose the region closest to your users (e.g., `eu-central-1` for Europe)
4. Click **"Create new project"** and wait for provisioning (takes ~2 minutes)

## Step 2: Run Database Migration

1. Once your project is ready, go to the **SQL Editor** in your Supabase dashboard
2. Click **"New query"**
3. Copy the entire contents of `supabase-migration.sql` from the backend root directory
4. Paste it into the SQL Editor
5. Click **"Run"** to execute the migration
6. Verify the tables were created by going to **Table Editor** in the sidebar

You should see three tables:
- `orders`
- `equipment`
- `bids`

## Step 3: Get Your API Credentials

1. In your Supabase project, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://xxxxxxxxxxxxx.supabase.co`)
   - **Service Role Key** (under "Project API keys" - this is the secret key with full access)

⚠️ **Important**: Never commit the Service Role Key to version control. It has full database access.

## Step 4: Configure Environment Variables

### For Production (e.g., Render, Railway, Heroku)

Add these environment variables to your hosting platform:

```bash
USE_SUPABASE=true
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

Keep all other existing environment variables (JWT_SECRET, SMS_RU_API_ID, etc.)

### For Local Testing with Supabase

Update your local `.env` file:

```bash
USE_SUPABASE=true
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### For Local Development with SQLite (default)

Keep `USE_SUPABASE=false` or omit it entirely:

```bash
USE_SUPABASE=false
DATABASE_PATH=./data/app.db
```

## Step 5: Deploy to Production

### Option A: Deploy to Render

1. Go to https://render.com and create a new **Web Service**
2. Connect your GitHub repository
3. Configure the service:
   - **Build Command**: `cd spectech_backoffice && npm install`
   - **Start Command**: `cd spectech_backoffice && npm start`
   - **Environment Variables**: Add all variables from Step 4
4. Click **"Create Web Service"**

### Option B: Deploy to Railway

1. Go to https://railway.app and create a new project
2. Select **"Deploy from GitHub repo"**
3. Choose your repository
4. Add environment variables from Step 4
5. Railway will auto-detect Node.js and deploy

### Option C: Deploy to Heroku

```bash
# Install Heroku CLI and login
heroku login

# Create a new Heroku app
heroku create spectech-backoffice

# Set environment variables
heroku config:set USE_SUPABASE=true
heroku config:set SUPABASE_URL=https://your-project-ref.supabase.co
heroku config:set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
heroku config:set JWT_SECRET=your_jwt_secret
heroku config:set SMS_RU_API_ID=your_sms_api_id
# ... add other required env vars

# Deploy
git subtree push --prefix spectech_backoffice heroku main
```

## Step 6: Verify Deployment

1. Test the API health endpoint:
   ```bash
   curl https://your-app-url.com/api/health
   ```

2. Test authentication:
   ```bash
   curl -X POST https://your-app-url.com/api/auth/start \
     -H "Content-Type: application/json" \
     -d '{"phone": "+79990000000"}'
   ```

3. Check Supabase logs:
   - Go to **Logs** → **Database** in your Supabase dashboard
   - You should see queries being executed

## Database Management

### Viewing Data

Use the Supabase **Table Editor** to view and manage data directly in the browser.

### Running Queries

Use the **SQL Editor** to run custom queries:

```sql
-- View all orders
SELECT * FROM orders ORDER BY created_at DESC LIMIT 10;

-- Count bids per order
SELECT order_id, COUNT(*) as bid_count 
FROM bids 
GROUP BY order_id;

-- View equipment by category
SELECT category, COUNT(*) as count 
FROM equipment 
GROUP BY category;
```

### Backups

Supabase automatically backs up your database daily. To create a manual backup:

1. Go to **Settings** → **Database**
2. Scroll to **Backups**
3. Click **"Create backup"**

## Monitoring and Performance

### Enable Realtime (Optional)

If you want real-time subscriptions:

1. Go to **Database** → **Replication**
2. Enable replication for tables: `orders`, `bids`, `equipment`

### Monitor Performance

1. Go to **Reports** in your Supabase dashboard
2. Monitor:
   - API requests per second
   - Database connections
   - Query performance
   - Storage usage

### Set Up Alerts

1. Go to **Settings** → **Alerts**
2. Configure alerts for:
   - High database CPU usage
   - Connection pool exhaustion
   - Storage limits

## Security Best Practices

1. **Row Level Security (RLS)**: Currently disabled. Consider enabling RLS for additional security:
   ```sql
   ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
   ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
   ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
   ```

2. **API Keys**: 
   - Never expose the Service Role Key in client-side code
   - Use the Anon Key for client-side operations (if needed)
   - Rotate keys periodically in **Settings** → **API**

3. **Database Password**: 
   - Use a strong, unique password
   - Store it securely (e.g., in a password manager)
   - Never commit it to version control

## Troubleshooting

### Connection Errors

If you see "Failed to connect to Supabase":
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct
- Check that `USE_SUPABASE=true` is set
- Ensure your deployment has network access to Supabase

### Migration Errors

If the migration fails:
- Check the SQL Editor for error messages
- Ensure you're using a fresh database (or drop existing tables first)
- Verify PostgreSQL version compatibility (Supabase uses PostgreSQL 15)

### Performance Issues

If queries are slow:
- Check indexes in **Database** → **Indexes**
- Review slow queries in **Logs** → **Database**
- Consider adding indexes for frequently queried columns

## Switching Between SQLite and Supabase

The backend supports both databases. To switch:

**To Supabase**: Set `USE_SUPABASE=true`
**To SQLite**: Set `USE_SUPABASE=false` or remove the variable

This allows you to:
- Use SQLite for local development
- Use Supabase for staging/production
- Test both databases in different environments

## Cost Estimation

Supabase pricing (as of 2026):
- **Free tier**: 500MB database, 2GB bandwidth, 50MB file storage
- **Pro tier** ($25/month): 8GB database, 250GB bandwidth, 100GB storage
- **Team tier** ($599/month): Dedicated resources, priority support

For a small to medium application, the Free or Pro tier should be sufficient.

## Support

- **Supabase Docs**: https://supabase.com/docs
- **Supabase Discord**: https://discord.supabase.com
- **GitHub Issues**: Report backend issues in your repository

## Next Steps

1. ✅ Set up monitoring and alerts
2. ✅ Configure database backups
3. ✅ Test the API endpoints thoroughly
4. ✅ Update frontend to use production API URL
5. ✅ Set up CI/CD for automated deployments
6. ✅ Consider enabling Row Level Security for additional protection

---

**Last Updated**: March 2026
**Backend Version**: 1.0.0
