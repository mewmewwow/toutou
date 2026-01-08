# Tasks: 词善佳智能英语单词学习系统

**Input**: Design documents from `/specs/001-vocab-learning/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests for critical paths per Constitution II (FSRS, auth, guest migration, review scheduling, coin transactions, session management, fingerprint validation)

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/`
- **Frontend**: `frontend/src/`
- **Shared**: `shared/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and monorepo structure

- [x] T001 Create monorepo structure with `backend/`, `frontend/`, `shared/` directories
- [x] T002 [P] Initialize backend NestJS 10 project with TypeScript in `backend/package.json`
- [x] T003 [P] Initialize frontend Vite + React 18 project with TypeScript in `frontend/package.json`
- [x] T004 [P] Initialize shared types package in `shared/package.json`
- [x] T005 [P] Configure ESLint + Prettier for backend in `backend/.eslintrc.js` (Constitution I)
- [x] T006 [P] Configure ESLint + Prettier for frontend in `frontend/.eslintrc.js` (Constitution I)
- [x] T007 [P] Configure pre-commit hooks with Husky in root `package.json` (Constitution I)
- [x] T008 [P] Create shared constants for module types (1-13) in `shared/constants/modules.ts`
- [x] T009 [P] Create shared TypeScript types for API contracts in `shared/types/api.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

### Database & ORM

- [x] T010 Configure PostgreSQL connection in `backend/src/config/database.config.ts`
- [x] T011 Configure Redis connection in `backend/src/config/redis.config.ts`
- [x] T012 Create User entity in `backend/src/modules/users/entities/user.entity.ts`
- [x] T013 [P] Create Device entity in `backend/src/modules/devices/entities/device.entity.ts`
- [x] T014 [P] Create Book entity in `backend/src/modules/books/entities/book.entity.ts`
- [x] T015 [P] Create Word entity in `backend/src/modules/books/entities/word.entity.ts`
- [x] T016 [P] Create Sentence entity in `backend/src/modules/books/entities/sentence.entity.ts`
- [x] T017 [P] Create Card entity (FSRS state) in `backend/src/modules/fsrs/entities/card.entity.ts`
- [x] T018 [P] Create Revlog entity in `backend/src/modules/fsrs/entities/revlog.entity.ts`
- [x] T019 [P] Create LearningSession entity in `backend/src/modules/learning/entities/learning-session.entity.ts`
- [x] T020 [P] Create TestAttempt entity in `backend/src/modules/tests/entities/test-attempt.entity.ts`
- [x] T021 [P] Create CoinTransaction entity in `backend/src/modules/rewards/entities/coin-transaction.entity.ts`
- [x] T022 [P] Create UserBook entity in `backend/src/modules/books/entities/user-book.entity.ts`
- [x] T023 Generate TypeORM migrations for all entities in `backend/src/migrations/`
- [x] T024 Create vocabulary data seed script in `backend/src/seeds/vocabulary.seed.ts`

### Error Handling & Infrastructure

- [x] T025 Create global exception filter in `backend/src/common/filters/http-exception.filter.ts` (Constitution IV)
- [x] T026 [P] Create error code constants matching `contracts/errors.md` in `backend/src/common/constants/error-codes.ts`
- [x] T027 [P] Create custom exception classes in `backend/src/common/exceptions/`
- [x] T028 [P] Configure request logging interceptor in `backend/src/common/interceptors/logging.interceptor.ts`
- [x] T029 [P] Configure rate limiting with Redis in `backend/src/common/guards/throttle.guard.ts` (60 req/min)

### FSRS Algorithm (Critical Path - Requires Tests)

- [x] T030 Unit test for FSRS service in `backend/test/unit/fsrs/fsrs.service.spec.ts` (Constitution II)
- [x] T031 Implement FSRS service wrapper using ts-fsrs in `backend/src/modules/fsrs/fsrs.service.ts`
- [x] T032 Unit test for retrievability calculation in `backend/test/unit/fsrs/retrievability.spec.ts`
- [x] T033 Implement retrievability percentage calculation in `backend/src/modules/fsrs/fsrs.utils.ts`

### Frontend Foundation

- [x] T034 Configure TailwindCSS in `frontend/tailwind.config.js`
- [x] T035 [P] Configure React Query provider in `frontend/src/providers/QueryProvider.tsx`
- [x] T036 [P] Create API client with axios in `frontend/src/services/api.ts`
- [x] T037 [P] Create audio playback utility with Youdao + SpeechSynthesis fallback in `frontend/src/utils/audio/playAudio.ts`
- [x] T038 [P] Create device fingerprint utility in `frontend/src/utils/fingerprint/generateFingerprint.ts`
- [x] T039 [P] Create base UI components (Button, Input, Card) in `frontend/src/components/ui/`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Guest Trial Experience (Priority: P1)

**Goal**: Allow visitors to learn Unit 1 without registration, track progress with device fingerprint

**Independent Test**: User can access site, select book, complete Unit 1 learning, see results - all without account

### Tests for User Story 1 (Critical Path)

- [x] T040 [P] [US1] Unit test for device fingerprint validation in `backend/test/unit/devices/fingerprint.spec.ts`
- [x] T041 [P] [US1] Integration test for guest session creation in `backend/test/integration/learning/guest-session.spec.ts`
- [x] T042 [P] [US1] Contract test for GET /books in `backend/test/contract/books.spec.ts`
- [x] T043 [P] [US1] Contract test for POST /learning/sessions (guest) in `backend/test/contract/learning-sessions.spec.ts`

### Backend Implementation for US1

- [x] T044 [US1] Implement DevicesModule in `backend/src/modules/devices/devices.module.ts`
- [x] T045 [US1] Implement DevicesService for fingerprint validation in `backend/src/modules/devices/devices.service.ts`
- [x] T046 [US1] Create GuestAuthGuard in `backend/src/common/guards/guest-auth.guard.ts`
- [x] T047 [US1] Implement BooksModule in `backend/src/modules/books/books.module.ts`
- [x] T048 [US1] Implement BooksService in `backend/src/modules/books/books.service.ts`
- [x] T049 [US1] Implement BooksController (GET /books, GET /books/:id) in `backend/src/modules/books/books.controller.ts`
- [x] T050 [US1] Implement WordsService in `backend/src/modules/books/words.service.ts`
- [x] T051 [US1] Implement unit access validation (Unit 1 only for guests) in `backend/src/modules/books/guards/unit-access.guard.ts`
- [x] T052 [US1] Implement LearningModule in `backend/src/modules/learning/learning.module.ts`
- [x] T053 [US1] Implement LearningSessionService in `backend/src/modules/learning/learning-session.service.ts`
- [x] T054 [US1] Implement LearningController (POST /sessions, GET /sessions/:id/next, POST /sessions/:id/submit) in `backend/src/modules/learning/learning.controller.ts`

### Frontend Implementation for US1

- [x] T055 [P] [US1] Create guest fingerprint Zustand store in `frontend/src/stores/guestStore.ts`
- [x] T056 [P] [US1] Create book selection API hooks in `frontend/src/hooks/useBooks.ts`
- [x] T057 [US1] Create HomePage with book browser in `frontend/src/pages/home/HomePage.tsx`
- [x] T058 [US1] Create BookCard component in `frontend/src/components/ui/BookCard.tsx`
- [x] T059 [US1] Create BookDetailPage with unit list in `frontend/src/pages/home/BookDetailPage.tsx`
- [x] T060 [US1] Create unit access lock indicator component in `frontend/src/components/ui/UnitLock.tsx`
- [x] T061 [US1] Create learning session Zustand store in `frontend/src/stores/learningStore.ts`
- [x] T062 [US1] Implement router with guest-accessible routes in `frontend/src/router.tsx`
- [x] T063 [US1] Create registration prompt component in `frontend/src/components/ui/RegistrationPrompt.tsx`

**Checkpoint**: Guest can browse books and access Unit 1 - independent test should pass

---

## Phase 4: User Story 2 - Core Word Learning Flow (Priority: P1)

**Goal**: Implement 3 word learning modules with FSRS scoring, 10-word batches, vocabulary reinforcement

**Independent Test**: User completes full learning session in any word module with proper feedback and FSRS scoring

### Tests for User Story 2 (Critical Path)

- [x] T064 [P] [US2] Unit test for batch management (10 words) in `backend/test/unit/learning/batch.spec.ts`
- [x] T065 [P] [US2] Unit test for vocabulary reinforcement trigger in `backend/test/unit/learning/reinforcement.spec.ts`
- [x] T066 [P] [US2] Integration test for learning submission flow in `backend/test/integration/learning/submit.spec.ts`
- [x] T067 [P] [US2] Contract test for POST /learning/sessions/:id/submit in `backend/test/contract/learning-submit.spec.ts`

### Backend Implementation for US2

- [x] T068 [US2] Implement CardService for FSRS card management in `backend/src/modules/fsrs/card.service.ts`
- [x] T069 [US2] Implement RevlogService for review logging in `backend/src/modules/fsrs/revlog.service.ts`
- [x] T070 [US2] Implement batch management in LearningSessionService (10-word batches) in `backend/src/modules/learning/learning-session.service.ts`
- [x] T071 [US2] Implement vocabulary reinforcement logic (词义强化) in `backend/src/modules/learning/reinforcement.service.ts`
- [x] T072 [US2] Implement word graduation logic (correct on first try = graduate) in `backend/src/modules/fsrs/card.service.ts`
- [x] T073 [US2] Add DTOs for learning submission in `backend/src/modules/learning/dto/`
- [x] T074 [US2] Implement time limit validation (letter_count × 2 seconds) in `backend/src/modules/learning/validators/time-limit.validator.ts`

### Frontend Implementation for US2

- [x] T075 [P] [US2] Create WordDisplay component in `frontend/src/components/learning/WordDisplay.tsx`
- [x] T076 [P] [US2] Create DefinitionCard component in `frontend/src/components/learning/DefinitionCard.tsx`
- [x] T077 [P] [US2] Create SentenceDisplay component in `frontend/src/components/learning/SentenceDisplay.tsx`
- [x] T078 [P] [US2] Create AudioButton component with Ctrl shortcut in `frontend/src/components/learning/AudioButton.tsx`
- [x] T079 [US2] Create SmartRecognition module page (形→义) in `frontend/src/pages/learn/SmartRecognitionPage.tsx`
- [x] T080 [US2] Create SmartDictation module page (音→形) in `frontend/src/pages/learn/SmartDictationPage.tsx`
- [x] T081 [US2] Create SmartWriting module page (义→形) in `frontend/src/pages/learn/SmartWritingPage.tsx`
- [x] T082 [US2] Create SpellingInput component with validation in `frontend/src/components/learning/SpellingInput.tsx`
- [x] T083 [US2] Create FillInBlank correction component in `frontend/src/components/learning/FillInBlank.tsx`
- [x] T084 [US2] Create VocabReinforcement component (词义强化) in `frontend/src/components/learning/VocabReinforcement.tsx`
- [x] T085 [US2] Create BatchProgress component in `frontend/src/components/learning/BatchProgress.tsx`
- [x] T086 [US2] Create LearningTimer component (60s cap per question) in `frontend/src/components/learning/LearningTimer.tsx`
- [x] T087 [US2] Implement keyboard shortcuts (Ctrl, Shift, Enter, 1-4, Tab) in `frontend/src/hooks/useLearningKeyboard.ts`

**Checkpoint**: Word learning modules functional with FSRS scoring - independent test should pass

---

## Phase 5: User Story 3 - Sentence Learning Flow (Priority: P2)

**Goal**: Implement 4 sentence-based learning modules with drag-drop ordering and typed input

**Independent Test**: User completes sentence exercises with appropriate feedback

### Tests for User Story 3

- [x] T088 [P] [US3] Unit test for sentence scrambling algorithm in `backend/test/unit/learning/sentence-scramble.spec.ts`
- [x] T089 [P] [US3] Integration test for sentence module submission in `backend/test/integration/learning/sentence-submit.spec.ts`

### Backend Implementation for US3

- [x] T090 [US3] Implement sentence scrambling service in `backend/src/modules/learning/sentence-scramble.service.ts`
- [x] T091 [US3] Implement sentence validation (correct order check) in `backend/src/modules/learning/sentence-validation.service.ts`
- [x] T092 [US3] Add sentence module types (7-10) handling in `backend/src/modules/learning/learning-session.service.ts`

### Frontend Implementation for US3

- [x] T093 [P] [US3] Create DraggableWord component in `frontend/src/components/learning/DraggableWord.tsx`
- [x] T094 [P] [US3] Create WordOrderArea (drop zone) component in `frontend/src/components/learning/WordOrderArea.tsx`
- [x] T095 [US3] Create SentenceListeningPage (例句听组) in `frontend/src/pages/learn/SentenceListeningPage.tsx`
- [x] T096 [US3] Create SentenceTranslationPage (例句翻译) in `frontend/src/pages/learn/SentenceTranslationPage.tsx`
- [x] T097 [US3] Create SentenceDictationPage (例句听写) in `frontend/src/pages/learn/SentenceDictationPage.tsx`
- [x] T098 [US3] Create SmartWordUsagePage (智能用词) in `frontend/src/pages/learn/SmartWordUsagePage.tsx`
- [x] T099 [US3] Implement sentence timer (char_count × 2 seconds) in `frontend/src/hooks/useSentenceTimer.ts`

**Checkpoint**: Sentence learning modules functional - independent test should pass

---

## Phase 6: User Story 4 - Smart Review System (Priority: P2)

**Goal**: FSRS-based review dashboard with blocking logic for >25 overdue words

**Independent Test**: User sees due words, completes reviews with FSRS-scheduled intervals

### Tests for User Story 4 (Critical Path)

- [ ] T100 [P] [US4] Unit test for review blocking logic (>25 words) in `backend/test/unit/review/blocking.spec.ts`
- [ ] T101 [P] [US4] Unit test for review scheduling order in `backend/test/unit/review/scheduling.spec.ts`
- [ ] T102 [P] [US4] Contract test for GET /review/due in `backend/test/contract/review-due.spec.ts`
- [ ] T103 [P] [US4] Contract test for POST /review/cards/:id in `backend/test/contract/review-submit.spec.ts`

### Backend Implementation for US4

- [ ] T104 [US4] Implement ReviewModule in `backend/src/modules/review/review.module.ts`
- [ ] T105 [US4] Implement ReviewService with FSRS integration in `backend/src/modules/review/review.service.ts`
- [ ] T106 [US4] Implement review blocking logic (>25 overdue) in `backend/src/modules/review/review-blocking.service.ts`
- [ ] T107 [US4] Implement ReviewController (GET /due, GET /cards, POST /cards/:id, GET /tracking) in `backend/src/modules/review/review.controller.ts`
- [ ] T108 [US4] Implement memory tracking data aggregation in `backend/src/modules/review/tracking.service.ts`
- [ ] T109 [US4] Add review blocking guard in `backend/src/modules/review/guards/review-blocking.guard.ts`

### Frontend Implementation for US4

- [ ] T110 [P] [US4] Create ReviewDashboardPage in `frontend/src/pages/review/ReviewDashboardPage.tsx`
- [ ] T111 [P] [US4] Create WordCloudView component in `frontend/src/components/review/WordCloudView.tsx`
- [ ] T112 [P] [US4] Create ReviewListView component in `frontend/src/components/review/ReviewListView.tsx`
- [ ] T113 [P] [US4] Create CalendarView component in `frontend/src/components/review/CalendarView.tsx`
- [ ] T114 [US4] Create WordHoverCard (definition, stats, retrievability) in `frontend/src/components/review/WordHoverCard.tsx`
- [ ] T115 [US4] Create SmartReviewPage in `frontend/src/pages/review/SmartReviewPage.tsx`
- [ ] T116 [US4] Create ReviewBlockingModal component in `frontend/src/components/review/ReviewBlockingModal.tsx`
- [ ] T117 [US4] Implement review session navigation (module order) in `frontend/src/hooks/useReviewSession.ts`

**Checkpoint**: Review system functional with FSRS scheduling - independent test should pass

---

## Phase 7: User Story 5 - Testing and Challenge System (Priority: P2)

**Goal**: Unit tests with Normal, Speed Challenge, Ultimate Challenge modes and star awards

**Independent Test**: User takes tests in all modes with timing, scoring, and star rewards

### Tests for User Story 5

- [ ] T118 [P] [US5] Unit test for test scoring calculation in `backend/test/unit/tests/scoring.spec.ts`
- [ ] T119 [P] [US5] Unit test for star awarding logic in `backend/test/unit/tests/stars.spec.ts`
- [ ] T120 [P] [US5] Contract test for POST /tests/start in `backend/test/contract/tests-start.spec.ts`
- [ ] T121 [P] [US5] Contract test for POST /tests/:id/submit in `backend/test/contract/tests-submit.spec.ts`

### Backend Implementation for US5

- [ ] T122 [US5] Implement TestsModule in `backend/src/modules/tests/tests.module.ts`
- [ ] T123 [US5] Implement TestsService in `backend/src/modules/tests/tests.service.ts`
- [ ] T124 [US5] Implement test question generation (50 en→cn + 50 cn→en for Recognition) in `backend/src/modules/tests/question-generator.service.ts`
- [ ] T125 [US5] Implement test timing validation (mode-specific) in `backend/src/modules/tests/timing.service.ts`
- [ ] T126 [US5] Implement star awarding logic in `backend/src/modules/tests/star.service.ts`
- [ ] T127 [US5] Implement TestsController (POST /start, POST /:id/submit) in `backend/src/modules/tests/tests.controller.ts`
- [ ] T128 [US5] Add review blocking check before test start in `backend/src/modules/tests/guards/pre-test-review.guard.ts`

### Frontend Implementation for US5

- [ ] T129 [P] [US5] Create TestModePage in `frontend/src/pages/test/TestModePage.tsx`
- [ ] T130 [P] [US5] Create TestQuestionGrid component in `frontend/src/components/test/TestQuestionGrid.tsx`
- [ ] T131 [P] [US5] Create TestTimer component in `frontend/src/components/test/TestTimer.tsx`
- [ ] T132 [US5] Create NormalModeTest page in `frontend/src/pages/test/NormalModeTest.tsx`
- [ ] T133 [US5] Create SpeedChallengeTest page in `frontend/src/pages/test/SpeedChallengeTest.tsx`
- [ ] T134 [US5] Create UltimateChallengeTest page in `frontend/src/pages/test/UltimateChallengeTest.tsx`
- [ ] T135 [US5] Create TestResultsPage with star display in `frontend/src/pages/test/TestResultsPage.tsx`
- [ ] T136 [US5] Create StarDisplay component in `frontend/src/components/test/StarDisplay.tsx`

**Checkpoint**: Testing system functional with all modes - independent test should pass

---

## Phase 8: User Story 6 - User Registration and Membership (Priority: P3)

**Goal**: Multi-method registration with 14-day trial and membership management

**Independent Test**: User registers via email/phone/OAuth, receives trial, manages account

### Tests for User Story 6 (Critical Path)

- [ ] T137 [P] [US6] Unit test for guest data migration in `backend/test/unit/auth/guest-migration.spec.ts`
- [ ] T138 [P] [US6] Integration test for registration flow in `backend/test/integration/auth/register.spec.ts`
- [ ] T139 [P] [US6] Contract test for POST /auth/register in `backend/test/contract/auth-register.spec.ts`
- [ ] T140 [P] [US6] Contract test for POST /auth/guest/migrate in `backend/test/contract/auth-migrate.spec.ts`

### Backend Implementation for US6

- [ ] T141 [US6] Implement AuthModule in `backend/src/modules/auth/auth.module.ts`
- [ ] T142 [US6] Implement LocalStrategy (email/password) in `backend/src/modules/auth/strategies/local.strategy.ts`
- [ ] T143 [US6] Implement JwtStrategy in `backend/src/modules/auth/strategies/jwt.strategy.ts`
- [ ] T144 [US6] Implement SmsStrategy with Tencent Cloud in `backend/src/modules/auth/strategies/sms.strategy.ts`
- [ ] T145 [US6] Implement GoogleStrategy in `backend/src/modules/auth/strategies/google.strategy.ts`
- [ ] T146 [US6] Implement WechatStrategy in `backend/src/modules/auth/strategies/wechat.strategy.ts`
- [ ] T147 [US6] Implement AuthService in `backend/src/modules/auth/auth.service.ts`
- [ ] T148 [US6] Implement guest data migration service in `backend/src/modules/auth/guest-migration.service.ts`
- [ ] T149 [US6] Implement trial period management (14 days) in `backend/src/modules/users/membership.service.ts`
- [ ] T150 [US6] Implement device limit enforcement (max 3) in `backend/src/modules/devices/device-limit.service.ts`
- [ ] T151 [US6] Implement AuthController in `backend/src/modules/auth/auth.controller.ts`
- [ ] T152 [US6] Implement UsersModule in `backend/src/modules/users/users.module.ts`
- [ ] T153 [US6] Implement UsersService in `backend/src/modules/users/users.service.ts`
- [ ] T154 [US6] Implement UsersController (GET /me, PATCH /me, GET /me/devices) in `backend/src/modules/users/users.controller.ts`

### Frontend Implementation for US6

- [ ] T155 [P] [US6] Create auth Zustand store in `frontend/src/stores/authStore.ts`
- [ ] T156 [P] [US6] Create LoginPage in `frontend/src/pages/auth/LoginPage.tsx`
- [ ] T157 [P] [US6] Create RegisterPage in `frontend/src/pages/auth/RegisterPage.tsx`
- [ ] T158 [US6] Create EmailRegisterForm component in `frontend/src/components/auth/EmailRegisterForm.tsx`
- [ ] T159 [US6] Create PhoneRegisterForm component with SMS in `frontend/src/components/auth/PhoneRegisterForm.tsx`
- [ ] T160 [US6] Create OAuthButtons component (Google, WeChat) in `frontend/src/components/auth/OAuthButtons.tsx`
- [ ] T161 [US6] Create TrialCountdown component (VIP试用剩余X天) in `frontend/src/components/ui/TrialCountdown.tsx`
- [ ] T162 [US6] Create ProfilePage in `frontend/src/pages/profile/ProfilePage.tsx`
- [ ] T163 [US6] Create DeviceManagementPage in `frontend/src/pages/profile/DeviceManagementPage.tsx`
- [ ] T164 [US6] Implement protected route guard in `frontend/src/router.tsx`

**Checkpoint**: Registration and membership functional - independent test should pass

---

## Phase 9: User Story 7 - Motivation and Rewards System (Priority: P3)

**Goal**: Coin earning, weekly medals, certificates, login streaks

**Independent Test**: User earns coins through activities, views medal progress, receives certificates

### Tests for User Story 7 (Critical Path)

- [ ] T165 [P] [US7] Unit test for coin awarding (daily cap 500) in `backend/test/unit/rewards/coins.spec.ts`
- [ ] T166 [P] [US7] Unit test for medal tier calculation in `backend/test/unit/rewards/medals.spec.ts`
- [ ] T167 [P] [US7] Contract test for GET /rewards/coins in `backend/test/contract/rewards-coins.spec.ts`
- [ ] T168 [P] [US7] Contract test for POST /rewards/login-streak in `backend/test/contract/rewards-streak.spec.ts`

### Backend Implementation for US7

- [ ] T169 [US7] Implement RewardsModule in `backend/src/modules/rewards/rewards.module.ts`
- [ ] T170 [US7] Implement CoinService with daily cap enforcement in `backend/src/modules/rewards/coin.service.ts`
- [ ] T171 [US7] Implement MedalService (7 tiers) in `backend/src/modules/rewards/medal.service.ts`
- [ ] T172 [US7] Implement CertificateService in `backend/src/modules/rewards/certificate.service.ts`
- [ ] T173 [US7] Implement LoginStreakService in `backend/src/modules/rewards/login-streak.service.ts`
- [ ] T174 [US7] Implement RewardsController in `backend/src/modules/rewards/rewards.controller.ts`
- [ ] T175 [US7] Add coin awarding hooks to learning/test completion in `backend/src/modules/learning/learning.service.ts`

### Frontend Implementation for US7

- [ ] T176 [P] [US7] Create CoinBalance component in `frontend/src/components/rewards/CoinBalance.tsx`
- [ ] T177 [P] [US7] Create CoinHistoryPage in `frontend/src/pages/rewards/CoinHistoryPage.tsx`
- [ ] T178 [P] [US7] Create MedalProgress component in `frontend/src/components/rewards/MedalProgress.tsx`
- [ ] T179 [US7] Create WeeklyMedalPage in `frontend/src/pages/rewards/WeeklyMedalPage.tsx`
- [ ] T180 [US7] Create CertificatesPage in `frontend/src/pages/rewards/CertificatesPage.tsx`
- [ ] T181 [US7] Create LoginStreakCalendar component in `frontend/src/components/rewards/LoginStreakCalendar.tsx`
- [ ] T182 [US7] Create MilestoneClaimButton component in `frontend/src/components/rewards/MilestoneClaimButton.tsx`

**Checkpoint**: Rewards system functional - independent test should pass

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Performance optimization, offline support, final validation

### Performance (Constitution V)

- [ ] T183 [P] Implement Service Worker with Workbox in `frontend/src/service-worker.ts`
- [ ] T184 [P] Implement IndexedDB offline queue in `frontend/src/utils/offline/offlineQueue.ts`
- [ ] T185 [P] Add database query optimization indexes review in `backend/src/migrations/`
- [ ] T186 Performance test for API endpoints (p95 < 500ms) in `backend/test/performance/api.spec.ts`
- [ ] T187 Performance test for frontend FCP (< 2s) in `frontend/tests/performance/fcp.spec.ts`

### E2E Tests

- [ ] T188 [P] E2E test: Guest learning flow in `frontend/tests/e2e/guest-learning.spec.ts`
- [ ] T189 [P] E2E test: Register → Learn → Review → Test flow in `frontend/tests/e2e/full-flow.spec.ts`

### Data Management

- [ ] T190 Create guest data cleanup job (30-day retention) in `backend/src/jobs/guest-cleanup.job.ts`
- [ ] T191 Create trial expiration job in `backend/src/jobs/trial-expiration.job.ts`

### Final Validation

- [ ] T192 Run quickstart.md validation - verify all setup steps work
- [ ] T193 Final linter check across all code (Constitution I)
- [ ] T194 Verify all error handling implemented per contracts/errors.md (Constitution IV)
- [ ] T195 Security review: validate input sanitization, auth guards, rate limiting

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-9)**: All depend on Foundational phase completion
  - US1 and US2 (P1) should complete before other stories
  - US3-5 (P2) can proceed after US1/US2
  - US6-7 (P3) can proceed after US1/US2
- **Polish (Phase 10)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational - Extends US1 learning foundation
- **User Story 3 (P2)**: Can start after US2 - Uses learning infrastructure
- **User Story 4 (P2)**: Can start after US2 - Uses FSRS cards from learning
- **User Story 5 (P2)**: Can start after US2 - Uses learning/FSRS infrastructure
- **User Story 6 (P3)**: Can start after US1 - Extends guest to registered user flow
- **User Story 7 (P3)**: Can start after US2 - Hooks into learning/test completion

### Within Each User Story

- Tests (for critical paths) MUST be written and FAIL before implementation
- Entities/Models before services
- Services before controllers/pages
- Backend before frontend (API must exist)
- Core implementation before integration

### Parallel Opportunities

**Phase 2 (Foundational)**:
```
T013-T022: All entity definitions can run in parallel
T025-T029: All infrastructure tasks can run in parallel
```

**Phase 3 (US1)**:
```
T040-T043: All tests can run in parallel
T055-T056: Frontend stores/hooks can run in parallel
```

**Phase 4 (US2)**:
```
T064-T067: All tests can run in parallel
T075-T078: All UI components can run in parallel
```

---

## Parallel Example: User Story 2

```bash
# Launch all tests for US2 together:
Task: "Unit test for batch management in backend/test/unit/learning/batch.spec.ts"
Task: "Unit test for vocabulary reinforcement in backend/test/unit/learning/reinforcement.spec.ts"
Task: "Integration test for learning submission in backend/test/integration/learning/submit.spec.ts"
Task: "Contract test for POST /learning/sessions/:id/submit in backend/test/contract/learning-submit.spec.ts"

# Launch all UI components for US2 together:
Task: "Create WordDisplay component in frontend/src/components/learning/WordDisplay.tsx"
Task: "Create DefinitionCard component in frontend/src/components/learning/DefinitionCard.tsx"
Task: "Create SentenceDisplay component in frontend/src/components/learning/SentenceDisplay.tsx"
Task: "Create AudioButton component in frontend/src/components/learning/AudioButton.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Guest Trial)
4. Complete Phase 4: User Story 2 (Core Word Learning)
5. **STOP and VALIDATE**: Test guest learning flow end-to-end
6. Deploy/demo if ready - this is functional MVP

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 + US2 → Test independently → Deploy (MVP!)
3. Add US3 → Sentence learning → Deploy
4. Add US4 → Review system → Deploy
5. Add US5 → Testing system → Deploy
6. Add US6 → Registration → Deploy
7. Add US7 → Rewards → Deploy
8. Polish phase → Production-ready

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Guest) + User Story 6 (Auth)
   - Developer B: User Story 2 (Word Learning) + User Story 3 (Sentences)
   - Developer C: User Story 4 (Review) + User Story 5 (Tests)
   - Developer D: User Story 7 (Rewards) + Polish
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (Constitution II)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Critical paths from plan.md: FSRS scoring, auth, guest migration, review scheduling, coin transactions, session management, fingerprint validation
