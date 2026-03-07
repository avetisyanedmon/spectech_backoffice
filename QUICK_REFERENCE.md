# Quick Reference Guide

## Environment Configuration

### Local Development (SQLite)
```bash
USE_SUPABASE=false
DATABASE_PATH=./data/app.db
```

### Production (Supabase)
```bash
USE_SUPABASE=true
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_key
```

## Common Commands

### Start Server
```bash
# Development with auto-reload
npm run dev

# Production
npm start

# Run tests
npm test
```

### Database Operations

#### SQLite (Local)
```bash
# Reset database
rm data/app.db
npm start  # Recreates database

# View database
sqlite3 data/app.db
.tables
.schema orders
SELECT * FROM orders;
```

#### Supabase (Production)
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

-- Check database size
SELECT pg_size_pretty(pg_database_size(current_database()));
```

## API Testing

### Authentication
```bash
# Start OTP
curl -X POST http://localhost:5050/api/auth/start \
  -H "Content-Type: application/json" \
  -d '{"phone": "+79990000000"}'

# Verify OTP (dev test account)
curl -X POST http://localhost:5050/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"requestId": "REQUEST_ID", "code": "111111"}'

# Response includes JWT token
```

### Orders
```bash
# Get all orders (requires auth)
curl http://localhost:5050/api/orders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Create order
curl -X POST http://localhost:5050/api/orders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "equipmentCategory": "excavator",
    "city": "Moscow",
    "address": "Red Square, 1",
    "paymentTypes": ["cash", "card"],
    "pricingUnit": "hour",
    "workVolume": 10,
    "startDateTime": "2026-03-15T09:00:00Z",
    "durationHours": 48,
    "description": "Need excavator for construction"
  }'
```

### Equipment
```bash
# Get equipment
curl http://localhost:5050/api/equipment \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Add equipment
curl -X POST http://localhost:5050/api/equipment \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Caterpillar 320",
    "category": "Excavator",
    "characteristics": "20 ton, 2020 model",
    "photos": ["https://example.com/photo1.jpg"]
  }'
```

### Bids
```bash
# Submit bid
curl -X POST http://localhost:5050/api/orders/ORDER_ID/bids \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 5000,
    "deliveryPrice": 500,
    "paymentType": "cash",
    "comment": "Available immediately",
    "equipmentId": "EQUIPMENT_ID"
  }'
```

## Troubleshooting

### Server won't start
```bash
# Check port
lsof -i :5050

# Kill process if needed
kill -9 PID

# Check Node version
node --version  # Should be v14+
```

### Database connection errors

**SQLite:**
```bash
# Check file permissions
ls -la data/app.db

# Recreate database
rm data/app.db && npm start
```

**Supabase:**
```bash
# Test connection
node -e "
const { createClient } = require('@supabase/supabase-js');
const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
client.from('orders').select('count').then(console.log);
"
```

### SMS not sending
```bash
# Check SMS.ru balance
curl "https://sms.ru/sms/cost?api_id=YOUR_API_ID&to=79990000000&msg=test"

# Use test account
# Phone: +79990000000, Code: 111111
```

## Environment Variables Quick Reference

| Variable | Required | Example |
|----------|----------|---------|
| `USE_SUPABASE` | Yes | `true` or `false` |
| `SUPABASE_URL` | If Supabase | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | If Supabase | `eyJhbGc...` |
| `JWT_SECRET` | Yes | `your_secret_32_chars` |
| `SMS_RU_API_ID` | Yes | `your_api_id` |
| `PORT` | No | `5050` (default) |
| `DATABASE_PATH` | If SQLite | `./data/app.db` |

## Useful Supabase Queries

### Performance Monitoring
```sql
-- Slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Active connections
SELECT count(*) FROM pg_stat_activity;

-- Table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Data Management
```sql
-- Delete old test data
DELETE FROM orders WHERE created_at < NOW() - INTERVAL '30 days';

-- Reset bid counts
UPDATE orders SET bid_count = (
  SELECT COUNT(*) FROM bids WHERE bids.order_id = orders.id
);

-- Find orders without bids
SELECT * FROM orders WHERE bid_count = 0;
```

## Deployment Quick Commands

### Render
```bash
# View logs
render logs -f

# Restart service
render restart
```

### Railway
```bash
# View logs
railway logs

# Redeploy
railway up
```

### Heroku
```bash
# View logs
heroku logs --tail

# Restart
heroku restart

# Run migrations
heroku run node -e "console.log('Migration script here')"
```

## Security Checklist

- [ ] JWT_SECRET is strong (32+ chars)
- [ ] SUPABASE_SERVICE_ROLE_KEY is never in client code
- [ ] CORS origins are restricted
- [ ] HTTPS is enforced in production
- [ ] Test accounts are disabled in production
- [ ] Environment variables are not committed

## Monitoring URLs

- **API Docs**: `http://localhost:5050/api/docs`
- **Supabase Dashboard**: `https://app.supabase.com`
- **SMS.ru Dashboard**: `https://sms.ru`
- **Render Dashboard**: `https://dashboard.render.com`

## Support Resources

- [README.md](./README.md) - Full documentation
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Supabase setup guide
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Deployment steps
- [Supabase Docs](https://supabase.com/docs)
- [Express.js Docs](https://expressjs.com)

---

**Quick Tip**: Keep this file open in a separate tab for easy reference during development!
