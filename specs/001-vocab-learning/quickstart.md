# Quickstart: 词善佳智能英语单词学习系统

**Date**: 2026-01-07
**Phase**: 1 - Design

## Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | 20.x LTS | Runtime for frontend and backend |
| pnpm | 8.x | Package manager (preferred) |
| PostgreSQL | 15.x | Primary database |
| Redis | 7.x | Session cache, rate limiting |
| Git | 2.x | Version control |

### Development Tools

```bash
# Install pnpm if not already installed
npm install -g pnpm

# Verify installations
node --version  # v20.x.x
pnpm --version  # 8.x.x
psql --version  # 15.x
redis-cli --version  # 7.x.x
```

## Project Setup

### 1. Clone and Install Dependencies

```bash
# Clone repository
git clone <repository-url>
cd toutou

# Install all dependencies
pnpm install
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb cishanjia_dev
createdb cishanjia_test

# Run migrations (from backend directory)
cd backend
pnpm run migration:run

# Seed vocabulary data
pnpm run seed:vocabulary
```

### 3. Environment Configuration

Create `.env` files in both frontend and backend directories:

**backend/.env**
```env
# Database
DATABASE_URL=postgresql://localhost:5432/cishanjia_dev
DATABASE_TEST_URL=postgresql://localhost:5432/cishanjia_test

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=your-secure-secret-change-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# External Services
YOUDAO_API_BASE=https://dict.youdao.com
TENCENT_SMS_SECRET_ID=your-tencent-id
TENCENT_SMS_SECRET_KEY=your-tencent-key

# Rate Limiting
RATE_LIMIT_TTL=60000
RATE_LIMIT_MAX=60
```

**frontend/.env**
```env
VITE_API_URL=http://localhost:3000/api
VITE_ENABLE_DEVTOOLS=true
```

### 4. Start Development Servers

```bash
# Terminal 1: Start backend
cd backend
pnpm run start:dev

# Terminal 2: Start frontend
cd frontend
pnpm run dev

# Terminal 3: Start Redis (if not running as service)
redis-server
```

### 5. Verify Setup

```bash
# Backend health check
curl http://localhost:3000/api/health

# Frontend should be available at
open http://localhost:5173
```

## Development Workflow

### Running Tests

```bash
# Backend unit tests
cd backend && pnpm run test

# Backend e2e tests
cd backend && pnpm run test:e2e

# Frontend unit tests
cd frontend && pnpm run test

# E2E tests (requires running servers)
pnpm run test:e2e
```

### Code Quality

```bash
# Lint all code
pnpm run lint

# Format code
pnpm run format

# Type check
pnpm run typecheck
```

### Database Operations

```bash
# Generate new migration
cd backend && pnpm run migration:generate -- -n MigrationName

# Run pending migrations
cd backend && pnpm run migration:run

# Revert last migration
cd backend && pnpm run migration:revert
```

## Key Development Paths

### 1. Learning Flow

Start with these files to understand the core learning functionality:

```
backend/src/modules/learning/
├── learning.controller.ts    # API endpoints
├── learning.service.ts       # Business logic
└── dto/                      # Request/response types

frontend/src/pages/learn/
├── LearnPage.tsx            # Main learning page
└── components/              # Learning UI components
```

### 2. FSRS Integration

The spaced repetition algorithm implementation:

```
backend/src/modules/fsrs/
├── fsrs.service.ts          # FSRS-v6 calculations
├── fsrs.constants.ts        # Algorithm parameters
└── card.entity.ts           # Card state model
```

### 3. Authentication

Multi-method authentication setup:

```
backend/src/modules/auth/
├── strategies/              # Passport strategies
│   ├── local.strategy.ts    # Email/password
│   ├── jwt.strategy.ts      # Token validation
│   └── sms.strategy.ts      # Phone verification
├── auth.controller.ts       # Login/register endpoints
└── guards/                  # Auth guards
```

## API Documentation

Once the backend is running, access the Swagger documentation:

```
http://localhost:3000/api/docs
```

The OpenAPI specification is also available at:
```
specs/001-vocab-learning/contracts/api.yaml
```

## Common Issues

### PostgreSQL Connection Failed

```bash
# Check PostgreSQL is running
pg_isready

# Start PostgreSQL (macOS)
brew services start postgresql@15
```

### Redis Connection Refused

```bash
# Check Redis is running
redis-cli ping

# Start Redis (macOS)
brew services start redis
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

## Next Steps

1. Review the [spec.md](./spec.md) for functional requirements
2. Check [data-model.md](./data-model.md) for database schema
3. Read [contracts/api.yaml](./contracts/api.yaml) for API endpoints
4. See [contracts/errors.md](./contracts/errors.md) for error handling
