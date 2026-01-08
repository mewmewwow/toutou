# Implementation Plan: 词善佳智能英语单词学习系统

**Branch**: `001-vocab-learning` | **Date**: 2026-01-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-vocab-learning/spec.md`

## Summary

Build an intelligent English vocabulary learning web application using FSRS-v6 spaced repetition algorithm. The system provides 7 learning modules (3 word-based, 4 sentence-based) with gamification elements (coins, medals, certificates). Supports guest trial experience with seamless data migration upon registration, 14-day VIP trial, and tiered membership.

**Technical Approach**: React + TypeScript SPA frontend with NestJS backend, PostgreSQL for FSRS card state and user data, external Youdao API for pronunciation with browser SpeechSynthesis fallback.

## Technical Context

**Language/Version**: TypeScript 5.x (frontend & backend)
**Primary Dependencies**:
- Frontend: React 18, Vite, TailwindCSS, React Query, Zustand
- Backend: NestJS 10, TypeORM, Passport.js, class-validator
- Audio: Web Audio API, SpeechSynthesis API
**Storage**: PostgreSQL 15 (primary), Redis (session/rate-limiting)
**Testing**: Vitest (frontend), Jest (backend), Playwright (E2E)
**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge - latest 2 versions), desktop-first with responsive mobile
**Project Type**: Web application (frontend + backend)
**Performance Goals**:
- API endpoints: p95 < 500ms, p99 < 1000ms
- Frontend FCP: < 2s on 4G
- Frontend TTI: < 3s on 4G
- Audio playback start: < 300ms
- 10,000 concurrent learning sessions
**Constraints**:
- Rate limiting: 60 submissions/minute/user
- Max 3 concurrent devices per user
- Guest data retention: 30 days
**Scale/Scope**: 10,000 concurrent users, ~20 vocabulary books, ~70 words/unit

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate Question | Status | Notes |
|-----------|---------------|--------|-------|
| Code Style | Are linting/formatting tools specified in Technical Context? | [x] | ESLint + Prettier for both frontend/backend |
| Testing | Are all critical paths (auth, payment, data mutation) identified? | [x] | Critical paths: FSRS scoring, user auth, guest data migration, review scheduling, coin transactions |
| Simplicity | Is each abstraction justified with rejected simpler alternative? | [x] | No unnecessary patterns; NestJS modules for clean separation |
| Error Handling | Are error contracts defined for all public interfaces? | [x] | See contracts/errors.md |
| Performance | Are performance goals documented (API <500ms p95, FCP <2s)? | [x] | Goals documented above |

**Critical Paths Requiring Tests**:
1. FSRS algorithm calculations (stability, difficulty, due date)
2. User authentication (email, phone, OAuth)
3. Guest-to-user data migration
4. Review scheduling and blocking logic (>25 overdue words)
5. Coin award calculations and daily caps
6. Learning session state management
7. Device fingerprint generation and validation

## Project Structure

### Documentation (this feature)

```text
specs/001-vocab-learning/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── api.yaml         # OpenAPI 3.0 spec
│   └── errors.md        # Error code definitions
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── modules/
│   │   ├── auth/           # Authentication (email, phone, OAuth)
│   │   ├── users/          # User management, membership
│   │   ├── books/          # Vocabulary books, words, sentences
│   │   ├── learning/       # Learning sessions, modules
│   │   ├── fsrs/           # FSRS algorithm, cards, reviews
│   │   ├── tests/          # Unit tests, challenges
│   │   ├── rewards/        # Coins, medals, certificates
│   │   └── devices/        # Device management, fingerprinting
│   ├── common/
│   │   ├── guards/         # Auth guards, rate limiting
│   │   ├── filters/        # Exception filters
│   │   ├── interceptors/   # Logging, transform
│   │   └── decorators/     # Custom decorators
│   └── config/             # Environment, database config
├── test/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── package.json

frontend/
├── src/
│   ├── components/
│   │   ├── ui/             # Base UI components
│   │   ├── learning/       # Learning module components
│   │   ├── review/         # Review dashboard components
│   │   └── test/           # Test/challenge components
│   ├── pages/
│   │   ├── home/
│   │   ├── learn/
│   │   ├── review/
│   │   ├── test/
│   │   ├── profile/
│   │   └── auth/
│   ├── hooks/              # Custom React hooks
│   ├── stores/             # Zustand stores
│   ├── services/           # API clients
│   ├── utils/
│   │   ├── fsrs/           # FSRS calculations (client-side)
│   │   ├── audio/          # Audio playback with fallback
│   │   └── fingerprint/    # Device fingerprint generation
│   └── types/              # TypeScript types
├── tests/
│   ├── unit/
│   └── e2e/
└── package.json

shared/
├── types/                  # Shared TypeScript types
└── constants/              # Shared constants (module types, etc.)
```

**Structure Decision**: Web application pattern with separate frontend/backend. Shared types package for consistency. NestJS modular architecture for backend, feature-based organization for frontend.

## Complexity Tracking

> **No violations - all patterns justified**

| Pattern | Why Needed | Simpler Alternative Rejected Because |
|---------|------------|-------------------------------------|
| NestJS modules | Clean separation of 8 distinct domains (auth, learning, fsrs, etc.) | Flat Express would become tangled with 23+ functional requirements |
| Zustand stores | Learning session state is complex (current word, timer, batch progress) | useState would require excessive prop drilling |
| Redis for rate limiting | Distributed rate limiting across server instances | In-memory would fail with horizontal scaling |
