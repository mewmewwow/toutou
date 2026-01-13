# Feature Specification: 词善佳智能英语单词学习系统 (CiShanJia Intelligent English Vocabulary Learning System)

**Feature Branch**: `001-vocab-learning`
**Created**: 2026-01-07
**Status**: Draft
**Input**: User description: "词善佳智能英语单词学习系统 MVP V1.0"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Guest Trial Experience (Priority: P1)

A new visitor discovers the platform and wants to try the learning experience before committing to registration.

**Why this priority**: This is the critical acquisition funnel - users must experience value before converting. The "try before signup" model is essential for user growth.

**Independent Test**: User can access the site, select a vocabulary book, complete Unit 1 learning with full functionality, and see their results - all without creating an account.

**Acceptance Scenarios**:

1. **Given** a visitor arrives at the homepage, **When** they click "Start Learning", **Then** they can browse and select from available vocabulary books
2. **Given** a visitor has selected a vocabulary book, **When** they begin learning, **Then** they can access all learning modules for Unit 1 only
3. **Given** a visitor completes a learning session, **When** they view results, **Then** they see a prompt to register with message "注册后可解锁更多单元，并获得14天免费体验"
4. **Given** a visitor has learning data, **When** they later register/login, **Then** all their guest learning progress is automatically migrated to their account

---

### User Story 2 - Core Word Learning Flow (Priority: P1)

A student wants to learn new vocabulary using the three core word learning modules: Smart Recognition (智能认词), Smart Dictation (智能听写), and Smart Writing (智能默写).

**Why this priority**: These three modules form the foundation of the learning experience, covering Form→Meaning, Sound→Form, and Meaning→Form associations.

**Independent Test**: User can complete a full learning session in any word module, with proper feedback, timing, and FSRS scoring.

**Acceptance Scenarios**:

1. **Given** a user starts Smart Recognition (智能认词), **When** they see a word and click within 5 seconds, **Then** they confirm recognition or mark as unknown, with appropriate follow-up actions
2. **Given** a user marks a word as unknown or times out, **When** they enter the learning flow, **Then** they see the word, definition, example sentence with audio, and must complete required read-aloud repetitions
3. **Given** a user has learned 10 words, **When** the batch completes, **Then** Vocabulary Reinforcement (词义强化) automatically triggers for all 10 words
4. **Given** a user starts Smart Dictation (智能听写), **When** they hear audio, **Then** they must type the word within (letter_count × 2) seconds
5. **Given** a user makes a spelling error, **When** the answer is submitted, **Then** they see corrections and must complete the fill-in-the-blank copying exercise until correct
6. **Given** a user completes first-time learning correctly, **When** within time limit, **Then** the word "graduates" from that module and is excluded from FSRS review

---

### User Story 3 - Sentence Learning Flow (Priority: P2)

A student wants to reinforce vocabulary through sentence-based learning modules: Sentence Listening & Ordering (例句听组), Sentence Translation (例句翻译), and Sentence Dictation (例句听写).

**Why this priority**: Sentence modules reinforce word retention through contextual usage, building on the foundation of word learning.

**Independent Test**: User can complete sentence-based exercises with drag-and-drop ordering or typed input, receiving appropriate feedback.

**Acceptance Scenarios**:

1. **Given** a user starts Sentence Listening & Ordering, **When** audio plays, **Then** they see scrambled words and can drag/click to arrange in correct order
2. **Given** a user starts Sentence Translation, **When** they see Chinese text, **Then** they can arrange scrambled English words into the correct translation
3. **Given** a user starts Sentence Dictation, **When** they hear the sentence, **Then** they must type the complete sentence within (character_count × 2) seconds
4. **Given** a user makes errors in sentence exercises, **When** submitting, **Then** they enter the fill-in-the-blank correction flow for wrong words

---

### User Story 4 - Smart Review System (Priority: P2)

A returning student wants to review vocabulary based on FSRS spaced repetition algorithm to maintain optimal retention.

**Why this priority**: The review system is what distinguishes this product from simple flashcard apps - FSRS-based scheduling ensures efficient long-term retention.

**Independent Test**: User can access the review dashboard, see due words, and complete review sessions with FSRS-scheduled intervals.

**Acceptance Scenarios**:

1. **Given** a user has words due for review, **When** they open the Memory Tracking page, **Then** they see words displayed by urgency (word cloud, list, or calendar view)
2. **Given** a user hovers over a word, **When** viewing details, **Then** they see definition, study count, error count, memory strength (Retrievability %), and review prompt
3. **Given** a user clicks "Smart Review", **When** they have due words in multiple modules, **Then** review proceeds in module order: Recognition → Dictation → Writing → Sentences
4. **Given** a user has more than 25 overdue words total, **When** they try to learn new content, **Then** they are blocked and must complete reviews first

---

### User Story 5 - Testing and Challenge System (Priority: P2)

A student wants to test their knowledge through Unit tests with Normal, Speed Challenge, and Ultimate Challenge modes.

**Why this priority**: Testing validates learning and provides the gamification/achievement system that drives engagement.

**Independent Test**: User can take tests in all three modes, with appropriate timing, scoring, and star rewards.

**Acceptance Scenarios**:

1. **Given** a user has overdue review words, **When** they try to start a test, **Then** they must complete the full learning flow for overdue words first
2. **Given** a user starts Normal Mode test, **When** testing Recognition, **Then** they see 50 English→Chinese + 50 Chinese→English questions in grid layout with total time limit (questions × 3 seconds)
3. **Given** a user scores ≥90%, **When** completing a test, **Then** they pass and earn a star for that mode
4. **Given** a user completes Speed Challenge, **When** scoring ≥90% within total time (questions × 3 seconds for Recognition), **Then** they earn the Speed Challenge star
5. **Given** a user completes Ultimate Challenge, **When** answering each question within 5 seconds and scoring ≥90%, **Then** they earn the Ultimate Challenge star

---

### User Story 6 - User Registration and Membership (Priority: P3)

A user wants to register and manage their account, including trial period and paid membership.

**Why this priority**: Essential for monetization but not required for core learning experience validation.

**Independent Test**: User can register via email/phone/social login, receive 14-day VIP trial, and manage account settings.

**Acceptance Scenarios**:

1. **Given** a visitor decides to register, **When** they complete registration via email/phone/WeChat/Google, **Then** they receive 14-day VIP trial with full access
2. **Given** a user is on VIP trial, **When** viewing the navigation bar, **Then** they see "VIP试用剩余X天" countdown
3. **Given** a user's trial expires, **When** they have not paid, **Then** they are downgraded to free tier with access only to Unit 1 of their selected book
4. **Given** a paid member, **When** using the platform, **Then** they have access to all vocabulary books, all features, and unlimited learning

---

### User Story 7 - Motivation and Rewards System (Priority: P3)

A student wants to earn coins, medals, and certificates to stay motivated in their learning journey.

**Why this priority**: Gamification increases retention but is enhancement layer over core learning.

**Independent Test**: User can earn coins through learning activities, view weekly medal progress, and receive certificates.

**Acceptance Scenarios**:

1. **Given** a user completes learning, **When** tracking effective time, **Then** they earn 1 coin per minute (daily cap: 500 for learning activities)
2. **Given** a user passes a test for the first time, **When** viewing rewards, **Then** they earn bonus coins (Recognition: 10, Dictation/Writing: 20, Sentences: 30)
3. **Given** a user earns ≥99 coins in a week, **When** the week ends, **Then** they receive the appropriate medal (勤勉顽石 through 璀璨钻石)
4. **Given** a user completes all module tests for a book with ≥95%, **When** viewing achievements, **Then** they receive the "全能证书" (All-Round Certificate)

---

### Edge Cases

- What happens when network disconnects during learning? → Local caching with auto-sync on reconnection
- What happens when user switches devices? → Cloud sync with max 3 concurrent devices, oldest device auto-logged out
- What happens when audio fails to load? → Silently fallback to browser SpeechSynthesis; user experience remains seamless
- What happens when user abandons test mid-way? → Progress not saved, must restart
- What happens when free user accesses locked unit? → Show upgrade prompt with trial/payment options

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow visitors to learn Unit 1 of any vocabulary book without registration
- **FR-002**: System MUST generate device fingerprint for guests and migrate data to user account upon registration
- **FR-003**: System MUST provide 3 word learning modules: Smart Recognition (形→义), Smart Dictation (音→形), Smart Writing (义→形)
- **FR-004**: System MUST provide 4 sentence learning modules: Smart Word Usage (智能用词), Sentence Listening & Ordering (例句听组), Sentence Translation (例句翻译), Sentence Dictation (例句听写)
- **FR-005**: System MUST implement FSRS-v6 spaced repetition algorithm with 21 parameters and 90% target retention rate
- **FR-006**: System MUST schedule reviews with precision to the second and display memory strength (Retrievability percentage)
- **FR-007**: System MUST trigger Vocabulary Reinforcement (词义强化) every 10 words during Smart Recognition learning
- **FR-008**: System MUST implement fill-in-the-blank copying exercise for spelling errors
- **FR-009**: System MUST block new learning when overdue review count exceeds 25 words across all modules
- **FR-010**: System MUST provide 3 test modes per module: Normal (≥90% to pass), Speed Challenge, Ultimate Challenge
- **FR-011**: System MUST award 1-3 stars per module based on test mode completion
- **FR-012**: System MUST support registration via email, phone (Tencent Cloud SMS), WeChat, and Google OAuth
- **FR-013**: System MUST grant 14-day VIP trial to newly registered users with full platform access
- **FR-014**: System MUST downgrade expired trial users to free tier with Unit 1 access only
- **FR-015**: System MUST limit concurrent devices to 3, with oldest device auto-logged out when exceeded
- **FR-016**: System MUST award coins for learning time (1/minute, daily cap 500), test completion, and login streaks
- **FR-017**: System MUST display weekly medals based on total coins earned (7 tiers from 勤勉顽石 to 璀璨钻石)
- **FR-018**: System MUST provide keyboard shortcuts: Ctrl (replay word audio), Shift (play sentence audio), Enter (submit), 1-4 (select options), Tab (next question)
- **FR-019**: System MUST cap effective learning time per question at 60 seconds
- **FR-020**: System MUST support both British and American pronunciation with user preference setting
- **FR-021**: System MUST retain guest learning data for 30 days, then automatically purge if user has not registered
- **FR-022**: System MUST silently fallback to browser SpeechSynthesis when external audio API is unavailable, without indicating degraded mode to user
- **FR-023**: System MUST enforce rate limiting of 60 learning/review submissions per minute per user to prevent abuse

### Performance Requirements (Constitution V)

*Per Constitution: API endpoints p95 < 500ms, p99 < 1000ms; Frontend FCP < 2s, TTI < 3s*

- **PERF-001**: Learning module interactions MUST respond within 500ms at p95
- **PERF-002**: Main learning page MUST achieve First Contentful Paint within 2 seconds on 4G connection
- **PERF-003**: Audio playback MUST start within 300ms of user action
- **PERF-004**: System MUST support 10,000 concurrent learning sessions without degradation

### Key Entities *(include if feature involves data)*

- **User**: Represents a learner with account info, membership status, coin balance, level, and device associations
- **Vocabulary Book (Book)**: A collection of words organized by exam type (CET-4, CET-6, TOEFL, etc.) with units (~70 words each)
- **Word**: Individual vocabulary item with phonetics (US/UK), audio references, definitions, and parts of speech
- **Sentence**: Example sentences associated with words, marked as primary or secondary
- **Card**: FSRS learning card tracking user-word-module state including stability, difficulty, due date, and review history
- **Review Log (Revlog)**: Record of each review event with rating, response time, and interval changes

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 70% of first-time visitors who start learning complete at least one Unit 1 session
- **SC-002**: 40% of users who complete guest learning subsequently register within 7 days
- **SC-003**: Registered users average 15+ minutes of effective learning time per active day
- **SC-004**: Users achieve 85%+ accuracy on first-attempt module tests after completing learning flow
- **SC-005**: 80% of users with due reviews complete review sessions within 24 hours
- **SC-006**: System maintains user retention rate of 60% at Day 7 and 40% at Day 30
- **SC-007**: Users report learning experience satisfaction rating of 4.0+ out of 5.0
- **SC-008**: Page load completes within 3 seconds for 95% of users across all supported network conditions

## Clarifications

### Session 2026-01-07

- Q: How long is guest learning data retained before deletion if they never register? → A: 30 days, then purged automatically
- Q: What happens when external audio API (Youdao) is unavailable? → A: Silently fallback to browser SpeechSynthesis without showing degraded mode to user
- Q: What rate limiting applies to learning/review submissions? → A: 60 submissions per minute per user

## Assumptions

- Users have access to modern web browsers (Chrome, Firefox, Safari, Edge - latest 2 versions)
- Users have devices capable of audio playback for pronunciation features
- External pronunciation API (Youdao) will remain available and stable
- Vocabulary data from external source (kajweb/dict GitHub repository) is accurate and complete
- 14-day trial period is sufficient for users to experience enough value to convert
- 70 words per unit is an optimal batch size for learning sessions
- FSRS-v6 default parameters provide adequate personalization for MVP
