# SpecTech Backoffice Backend

Express.js backend API for the SpecTech Marketplace application with support for both SQLite (development) and Supabase PostgreSQL (production).

## Features

- 🔐 **Phone-based OTP Authentication** via SMS.ru
- 📦 **Dual Database Support**: SQLite for local dev, Supabase for production
- 🛠️ **RESTful API** with comprehensive validation
- 📊 **Order Management**: Create and manage equipment rental orders
- 💼 **Equipment Listings**: Contractors can list their equipment
- 💰 **Bidding System**: Contractors can bid on customer orders
- 🔒 **Role-based Authorization**: Customer and Contractor roles
- 📝 **API Documentation**: Swagger/OpenAPI docs at `/api/docs`

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js 5
- **Databases**: 
  - SQLite (better-sqlite3) - Local development
  - PostgreSQL (Supabase) - Production
- **Authentication**: JWT + SMS OTP
- **Validation**: Joi
- **API Docs**: Swagger UI

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and configure:

```bash
# For local development with SQLite (default)
USE_SUPABASE=false
DATABASE_PATH=./data/app.db

# For production with Supabase
USE_SUPABASE=true
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Required for all environments
JWT_SECRET=your_strong_secret_here
SMS_RU_API_ID=your_sms_ru_api_id
```

### 3. Run the Server

**Development mode** (with auto-reload):
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

The server will start on `http://localhost:5050`

### 4. View API Documentation

Open your browser and navigate to:
```
http://localhost:5050/api/docs
```

## Database Setup

### SQLite (Local Development)

SQLite is used by default for local development. The database file is automatically created at `./data/app.db` when you first run the server.

No additional setup required! ✨

### Supabase (Production)

For production deployment with Supabase:

1. Create a Supabase project at https://supabase.com
2. Run the migration script in Supabase SQL Editor (see `supabase-migration.sql`)
3. Get your project URL and Service Role Key
4. Set environment variables:
   ```bash
   USE_SUPABASE=true
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_key_here
   ```

📖 **Detailed setup guide**: See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

## API Endpoints

### Authentication

- `POST /api/auth/start` - Start OTP authentication
- `POST /api/auth/verify` - Verify OTP code and get JWT token

### Orders (Customer)

- `GET /api/orders?view=mine|marketplace|pending|all` - Get orders
- `POST /api/orders` - Create a new order

### Equipment (Contractor)

- `GET /api/equipment` - Get contractor's equipment
- `POST /api/equipment` - Add new equipment

### Bids (Contractor)

- `POST /api/orders/:orderId/bids` - Submit a bid on an order

## Authentication Flow

1. **Start OTP**: Client sends phone number to `/api/auth/start`
2. **Receive SMS**: User receives OTP code via SMS
3. **Verify OTP**: Client sends code to `/api/auth/verify`
4. **Get Token**: Server returns JWT token
5. **Use Token**: Include token in `Authorization: Bearer <token>` header

## Testing

### Test Accounts (Development Only)

When `NODE_ENV` is not `production`, these test accounts bypass SMS:

- **Customer**: `+79990000000` with code `111111`
- **Contractor**: `+79990000001` with code `222222`

### Run Tests

```bash
npm test
```

## Project Structure

```
spectech_backoffice/
├── src/
│   ├── controllers/       # Request handlers
│   ├── services/          # Business logic
│   ├── repositories/      # Database access layer
│   │   ├── *.repository.js           # SQLite repositories
│   │   ├── *.repository.supabase.js  # Supabase repositories
│   │   └── index.js                  # Repository factory
│   ├── db/
│   │   ├── database.js    # SQLite setup
│   │   └── supabase.js    # Supabase client
│   ├── middlewares/       # Express middlewares
│   ├── routes/            # API routes
│   ├── validators/        # Request validation
│   ├── utils/             # Helper functions
│   ├── constants/         # Application constants
│   ├── storage/           # OTP storage (in-memory/Redis)
│   ├── docs/              # OpenAPI specification
│   ├── app.js             # Express app setup
│   └── index.js           # Server entry point
├── data/                  # SQLite database files
├── tests/                 # Test files
├── .env.example           # Environment variables template
├── supabase-migration.sql # Supabase database schema
├── SUPABASE_SETUP.md      # Supabase setup guide
└── package.json
```

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5050` |
| `JWT_SECRET` | Secret for JWT signing | `your_strong_secret` |
| `SMS_RU_API_ID` | SMS.ru API key | `your_api_id` |

### Database (choose one)

**SQLite** (default):
```bash
USE_SUPABASE=false
DATABASE_PATH=./data/app.db
```

**Supabase**:
```bash
USE_SUPABASE=true
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_key
```

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `FRONTEND_ORIGINS` | Allowed CORS origins | `http://localhost:4028` |
| `SMS_RU_FROM` | SMS sender name | First approved sender |
| `OTP_HASH_PEPPER` | Extra OTP security | - |
| `REDIS_URL` | Redis connection URL | In-memory storage |
| `TEST_AUTH_PHONE` | Dev test phone #1 | `+79990000000` |
| `TEST_AUTH_CODE` | Dev test code #1 | `111111` |
| `TEST_AUTH_ROLE` | Dev test role #1 | `customer` |

## Deployment

### Deploy to Render

1. Create a new Web Service on [Render](https://render.com)
2. Connect your GitHub repository
3. Set root directory to `spectech_backoffice`
4. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add environment variables
6. Deploy!

### Deploy to Railway

1. Create a new project on [Railway](https://railway.app)
2. Connect your GitHub repository
3. Add environment variables
4. Railway auto-detects Node.js and deploys

### Deploy to Heroku

```bash
heroku create spectech-backoffice
heroku config:set USE_SUPABASE=true
heroku config:set SUPABASE_URL=https://xxxxx.supabase.co
heroku config:set SUPABASE_SERVICE_ROLE_KEY=your_key
# ... set other env vars
git subtree push --prefix spectech_backoffice heroku main
```

## Security Considerations

1. **Never commit secrets**: Use `.env` files and keep them out of version control
2. **Use strong JWT secrets**: Generate with `openssl rand -base64 32`
3. **Rotate API keys**: Periodically rotate SMS.ru and Supabase keys
4. **Enable HTTPS**: Always use HTTPS in production
5. **Rate limiting**: Consider adding rate limiting for auth endpoints
6. **Input validation**: All inputs are validated with Joi schemas

## Troubleshooting

### Server won't start

- Check that port 5050 is not in use: `lsof -i :5050`
- Verify all required environment variables are set
- Check Node.js version (requires v14+)

### Database errors

**SQLite**:
- Ensure `./data/` directory exists and is writable
- Delete `app.db` and restart to recreate

**Supabase**:
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct
- Check Supabase project is active
- Ensure migration script was run successfully

### SMS not sending

- Verify `SMS_RU_API_ID` is correct
- Check SMS.ru balance
- Ensure sender name is approved (if using `SMS_RU_FROM`)
- Use test accounts in development

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests: `npm test`
4. Submit a pull request

## License

Proprietary - All rights reserved

## Support

For issues and questions:
- Check the [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) guide
- Review API docs at `/api/docs`
- Contact the development team

---

Built with ❤️ for SpecTech Marketplace
