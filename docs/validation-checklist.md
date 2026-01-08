# Final Validation Checklist

This document covers the final validation tasks for Phase 10 (T192-T195).

## T192: Quickstart Validation

Run through the quickstart.md to verify all setup steps work correctly.

### Prerequisites Check

- [ ] Node.js 18+ installed
- [ ] PostgreSQL 14+ running
- [ ] Redis 6+ running

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env.local
# Configure database connection in .env.local
npm run migration:run
npm run seed
npm run start:dev
```

- [ ] Dependencies install without errors
- [ ] Migrations run successfully
- [ ] Seed data loads correctly
- [ ] Server starts on port 3000
- [ ] Health check responds: `GET http://localhost:3000/health`

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

- [ ] Dependencies install without errors
- [ ] Dev server starts on port 5173
- [ ] App loads in browser without errors
- [ ] Can see book list on homepage

### Integration Verification

- [ ] Frontend can connect to backend API
- [ ] Guest fingerprint is generated
- [ ] Can browse books as guest
- [ ] Can access Unit 1 learning

---

## T193: Final Linter Check

Run linting across all code to ensure Constitution I compliance.

### Backend Linting

```bash
cd backend
npm run lint
npm run lint:fix  # Auto-fix issues
```

- [ ] No ESLint errors
- [ ] No Prettier formatting issues
- [ ] All files follow naming conventions

### Frontend Linting

```bash
cd frontend
npm run lint
npm run lint:fix  # Auto-fix issues
```

- [ ] No ESLint errors
- [ ] No Prettier formatting issues
- [ ] All React components follow conventions

### TypeScript Check

```bash
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit
```

- [ ] No TypeScript compilation errors
- [ ] All types properly defined

---

## T194: Error Handling Verification

Verify all error handling matches `contracts/errors.md`.

### API Error Responses

All API errors should return:
```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable message",
  "details": {}
}
```

### Critical Error Codes to Verify

#### Authentication Errors
- [ ] `AUTH_INVALID_CREDENTIALS` - Wrong email/password
- [ ] `AUTH_TOKEN_EXPIRED` - JWT token expired
- [ ] `AUTH_UNAUTHORIZED` - Missing or invalid token
- [ ] `AUTH_DEVICE_LIMIT_EXCEEDED` - More than 3 devices

#### Guest Errors
- [ ] `GUEST_FINGERPRINT_INVALID` - Invalid device fingerprint
- [ ] `GUEST_UNIT_ACCESS_DENIED` - Guest accessing Unit 2+

#### Learning Errors
- [ ] `LEARNING_SESSION_NOT_FOUND` - Invalid session ID
- [ ] `LEARNING_SESSION_EXPIRED` - Session timeout
- [ ] `LEARNING_BLOCKED_BY_REVIEW` - >25 overdue reviews

#### Test Errors
- [ ] `TEST_BLOCKED_BY_REVIEWS` - >25 overdue reviews
- [ ] `TEST_TIME_EXCEEDED` - Speed/Ultimate challenge timeout
- [ ] `TEST_NOT_FOUND` - Invalid test ID

#### Rewards Errors
- [ ] `DAILY_COIN_LIMIT_REACHED` - 500 coin cap hit
- [ ] `ALREADY_CHECKED_IN` - Duplicate daily login

### Frontend Error Handling

- [ ] API errors display user-friendly messages
- [ ] Network errors show offline indicator
- [ ] Form validation shows inline errors
- [ ] Session expiry redirects to login

---

## T195: Security Review

Comprehensive security audit.

### Input Validation

- [ ] All API inputs validated with DTOs
- [ ] Email format validation
- [ ] Password complexity requirements (8+ chars)
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (output encoding)

### Authentication & Authorization

- [ ] Passwords hashed with bcrypt (10 rounds)
- [ ] JWT tokens properly signed
- [ ] Access tokens expire in 15 minutes
- [ ] Refresh tokens expire in 7 days
- [ ] Protected routes require valid JWT
- [ ] Guest routes check fingerprint
- [ ] Unit access checks membership status

### Rate Limiting

- [ ] Global rate limit: 60 req/min
- [ ] Login attempts limited
- [ ] Registration attempts limited
- [ ] API endpoints protected

### Data Protection

- [ ] Sensitive data not logged
- [ ] Passwords never returned in responses
- [ ] User data isolated by user ID
- [ ] Guest data auto-deleted after 30 days

### CORS & Headers

- [ ] CORS configured for frontend origin
- [ ] Security headers set (Helmet.js)
- [ ] HTTPS enforced in production

### Dependency Security

```bash
cd backend && npm audit
cd frontend && npm audit
```

- [ ] No critical vulnerabilities
- [ ] No high vulnerabilities
- [ ] Dependencies up to date

---

## Validation Sign-off

| Task | Status | Verified By | Date |
|------|--------|-------------|------|
| T192 Quickstart | [ ] Pass / [ ] Fail | | |
| T193 Linter | [ ] Pass / [ ] Fail | | |
| T194 Error Handling | [ ] Pass / [ ] Fail | | |
| T195 Security | [ ] Pass / [ ] Fail | | |

### Notes

_Add any issues found during validation here:_

---

## Post-Validation Actions

After all validations pass:

1. [ ] Update CHANGELOG.md with release notes
2. [ ] Tag release in git: `git tag -a v1.0.0 -m "Initial release"`
3. [ ] Build production artifacts
4. [ ] Deploy to staging environment
5. [ ] Run smoke tests on staging
6. [ ] Deploy to production
