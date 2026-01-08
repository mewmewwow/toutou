# Research: 词善佳智能英语单词学习系统

**Date**: 2026-01-07
**Phase**: 0 - Research

## 1. FSRS-v6 Algorithm Implementation

**Decision**: Use `ts-fsrs` npm package with custom wrapper

**Rationale**:
- Official TypeScript implementation of FSRS-v6 algorithm
- Maintained by the FSRS creator (open-spaced-repetition organization)
- Includes all 21 parameters with sensible defaults
- Well-tested with comprehensive test suite

**Alternatives Considered**:
- Custom implementation: Rejected - algorithm complexity high, risk of bugs
- py-fsrs (Python): Rejected - would require separate Python microservice
- fsrs-rs (Rust): Rejected - requires WASM compilation, adds complexity

**Integration Notes**:
- Use `ts-fsrs` on backend for authoritative scheduling
- Optional: mirror on frontend for optimistic UI updates
- Store raw FSRS state (stability, difficulty, due) in PostgreSQL
- Target retention rate: 90% (spec requirement)

## 2. Device Fingerprinting

**Decision**: FingerprintJS Pro (free tier) or custom lightweight fingerprint

**Rationale**:
- Need stable guest identification across sessions
- Must survive browser refresh, cookie clearing
- Privacy-conscious approach (no tracking, just identification)

**Alternatives Considered**:
- localStorage UUID only: Rejected - too easy to lose/clear
- Full FingerprintJS Pro: Overkill for MVP, expensive at scale
- Canvas fingerprint only: Rejected - too unstable across browser updates

**Implementation Approach**:
```typescript
// Combine multiple signals for stability
const fingerprint = hash([
  canvas.toDataURL(),
  navigator.userAgent,
  navigator.language,
  screen.width + 'x' + screen.height,
  new Date().getTimezoneOffset(),
  // Audio context fingerprint
]);
// Store in localStorage as backup
```

## 3. Audio Playback with Fallback

**Decision**: Youdao API primary, Web SpeechSynthesis fallback

**Rationale**:
- Youdao provides high-quality human pronunciation
- SpeechSynthesis universally available as fallback
- Silent fallback per clarification (no degraded mode indicator)

**Implementation**:
```typescript
async function playWordAudio(word: string, type: 'us' | 'uk'): Promise<void> {
  try {
    const audio = new Audio(
      `https://dict.youdao.com/dictvoice?audio=${word}&type=${type === 'us' ? 2 : 1}`
    );
    await audio.play();
  } catch {
    // Silent fallback to SpeechSynthesis
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = type === 'us' ? 'en-US' : 'en-GB';
    speechSynthesis.speak(utterance);
  }
}
```

## 4. Authentication Strategy

**Decision**: Passport.js with multiple strategies

**Rationale**:
- Mature, well-tested authentication middleware for Node.js
- Supports all required auth methods (email, phone, WeChat, Google)
- NestJS has first-class Passport integration

**Strategies Required**:
1. `passport-local` - Email/password
2. `passport-jwt` - Session tokens
3. Custom SMS strategy - Tencent Cloud SMS
4. `passport-google-oauth20` - Google OAuth
5. Custom WeChat strategy - WeChat OAuth

**Token Strategy**:
- JWT access tokens (15min expiry)
- Refresh tokens stored in Redis (7 day expiry)
- Device binding for token validation

## 5. Rate Limiting

**Decision**: Redis-based sliding window with NestJS throttler

**Rationale**:
- Spec requires 60 submissions/minute/user
- Must work across multiple server instances
- Redis provides atomic operations for accurate counting

**Implementation**:
```typescript
// NestJS Throttler with Redis store
@Throttle({ default: { limit: 60, ttl: 60000 } })
@Controller('study')
export class StudyController {
  // 60 requests per 60 seconds per user
}
```

## 6. Vocabulary Data Import

**Decision**: ETL script to import from kajweb/dict GitHub repository

**Rationale**:
- Data already structured in JSON format
- Fields match spec requirements (headWord, phonetics, trans, sentences)
- One-time import with periodic updates

**Import Strategy**:
1. Clone/download kajweb/dict repository
2. Parse JSON files per vocabulary book
3. Transform to PostgreSQL schema
4. Validate completeness (all words have audio, definitions)
5. Create seed scripts for development

## 7. Real-time Features

**Decision**: Polling for MVP, WebSocket for v2

**Rationale**:
- No real-time requirements in MVP spec
- PK system is "asynchronous challenge" (24hr response window)
- Polling sufficient for: review reminders, device sync
- WebSocket can be added for real-time PK in future

## 8. Offline Support

**Decision**: Service Worker with limited caching

**Rationale**:
- Spec mentions "local caching with auto-sync on reconnection"
- Critical: queue learning submissions when offline
- Cache current unit's words and audio

**Implementation**:
- Workbox for Service Worker management
- IndexedDB for offline submission queue
- Background sync for reconnection

## 9. State Management

**Decision**: Zustand for client state, React Query for server state

**Rationale**:
- Learning session state is complex but local (Zustand)
- Server data (words, books, user) benefits from caching (React Query)
- Both are lightweight and TypeScript-friendly

**Store Structure**:
```typescript
// Zustand: Learning session
interface LearningStore {
  currentModule: ModuleType;
  currentWord: Word | null;
  wordsInBatch: Word[];
  batchProgress: number;
  timerSeconds: number;
  // ...
}

// React Query: Server data
const { data: books } = useQuery(['books'], fetchBooks);
const { data: user } = useQuery(['user'], fetchCurrentUser);
```

## 10. Testing Strategy

**Decision**: Three-tier testing pyramid

**Rationale**:
- Constitution requires 80% coverage on critical paths
- FSRS algorithm must be exhaustively unit tested
- E2E for critical user journeys

**Coverage Targets**:
| Layer | Tools | Coverage Target | Focus Areas |
|-------|-------|-----------------|-------------|
| Unit | Jest/Vitest | 80%+ | FSRS calculations, coin logic, timer logic |
| Integration | Jest + Supertest | 70%+ | API endpoints, database operations |
| E2E | Playwright | Critical paths | Login → Learn → Review → Test flow |

## Summary of Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Frontend Framework | React | 18.x |
| Build Tool | Vite | 5.x |
| Styling | TailwindCSS | 3.x |
| State (Client) | Zustand | 4.x |
| State (Server) | React Query | 5.x |
| Backend Framework | NestJS | 10.x |
| ORM | TypeORM | 0.3.x |
| Database | PostgreSQL | 15.x |
| Cache/Sessions | Redis | 7.x |
| Auth | Passport.js | 0.7.x |
| FSRS | ts-fsrs | latest |
| Testing | Jest, Vitest, Playwright | latest |
| Linting | ESLint + Prettier | latest |
