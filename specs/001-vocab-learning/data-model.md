# Data Model: 词善佳智能英语单词学习系统

**Date**: 2026-01-07
**Phase**: 1 - Design

## Entity Relationship Overview

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    User     │───────│   Device    │       │    Book     │
└─────────────┘       └─────────────┘       └─────────────┘
      │                                            │
      │                                            │
      ▼                                            ▼
┌─────────────┐                             ┌─────────────┐
│    Card     │◄────────────────────────────│    Word     │
└─────────────┘                             └─────────────┘
      │                                            │
      │                                            │
      ▼                                            ▼
┌─────────────┐                             ┌─────────────┐
│   Revlog    │                             │  Sentence   │
└─────────────┘                             └─────────────┘
```

## Entities

### 1. User

Represents a registered learner or guest.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| email | VARCHAR(255) | UNIQUE, NULL | Email address (null for guests) |
| phone | VARCHAR(20) | UNIQUE, NULL | Phone number with country code |
| password_hash | VARCHAR(255) | NULL | Bcrypt hash (null for OAuth users) |
| username | VARCHAR(50) | NOT NULL | Display name |
| avatar | VARCHAR(500) | NULL | Avatar URL |
| birthday | DATE | NULL | For birthday rewards |
| total_coins | INTEGER | DEFAULT 0 | Accumulated coins |
| total_credits | INTEGER | DEFAULT 0 | Learning credits for level |
| level | INTEGER | DEFAULT 1 | User level (1-50+) |
| member_type | ENUM | NOT NULL | 'guest', 'free', 'trial', 'paid' |
| member_expire_at | TIMESTAMP | NULL | VIP expiration (trial or paid) |
| pronunciation_pref | ENUM | DEFAULT 'us' | 'us' or 'uk' |
| device_fingerprint | VARCHAR(64) | NULL | For guest identification |
| created_at | TIMESTAMP | NOT NULL | Registration timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

**Indexes**:
- `idx_user_email` UNIQUE on (email) WHERE email IS NOT NULL
- `idx_user_phone` UNIQUE on (phone) WHERE phone IS NOT NULL
- `idx_user_fingerprint` on (device_fingerprint) WHERE device_fingerprint IS NOT NULL

**State Transitions**:
```
guest ──register──► trial ──14 days──► free ──pay──► paid
                      │                               │
                      └─────────pay─────────────────►─┘
```

### 2. Device

Tracks user devices for session management.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → User | Owner (null for guests) |
| device_fingerprint | VARCHAR(64) | NOT NULL | Stable device identifier |
| device_name | VARCHAR(100) | NULL | User-friendly name (e.g., "Chrome on MacBook") |
| last_active_at | TIMESTAMP | NOT NULL | Last activity timestamp |
| created_at | TIMESTAMP | NOT NULL | First seen timestamp |

**Indexes**:
- `idx_device_user` on (user_id)
- `idx_device_fingerprint` UNIQUE on (device_fingerprint)

**Validation**:
- Max 3 devices per user (enforced in application logic)
- Max 5 new devices per user per month

### 3. Book

Vocabulary book (e.g., CET-4, TOEFL).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| name | VARCHAR(100) | NOT NULL | Display name (e.g., "四级核心词汇") |
| code | VARCHAR(50) | UNIQUE | Internal code (e.g., "cet4-core") |
| description | TEXT | NULL | Book description |
| total_words | INTEGER | NOT NULL | Word count |
| total_units | INTEGER | NOT NULL | Unit count |
| is_free | BOOLEAN | DEFAULT false | Free for all users (高中及以下) |
| cover_image | VARCHAR(500) | NULL | Cover image URL |
| sort_order | INTEGER | DEFAULT 0 | Display order |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |

**Indexes**:
- `idx_book_code` UNIQUE on (code)
- `idx_book_sort` on (sort_order)

### 4. Word

Individual vocabulary item.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| book_id | UUID | FK → Book | Parent book |
| unit_number | INTEGER | NOT NULL | Unit number (1-indexed) |
| word | VARCHAR(100) | NOT NULL | The English word |
| phonetic_us | VARCHAR(100) | NULL | US phonetic notation |
| phonetic_uk | VARCHAR(100) | NULL | UK phonetic notation |
| audio_us | VARCHAR(500) | NULL | US audio URL or Youdao param |
| audio_uk | VARCHAR(500) | NULL | UK audio URL or Youdao param |
| definitions | JSONB | NOT NULL | Array of {pos, meaning} |
| sort_order | INTEGER | DEFAULT 0 | Order within unit |
| created_at | TIMESTAMP | NOT NULL | Import timestamp |

**Indexes**:
- `idx_word_book_unit` on (book_id, unit_number)
- `idx_word_book_unit_sort` on (book_id, unit_number, sort_order)

**JSONB Structure for definitions**:
```json
[
  {"pos": "v.", "meaning": "取消；撤销"},
  {"pos": "n.", "meaning": "取消"}
]
```

### 5. Sentence

Example sentences for words.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| word_id | UUID | FK → Word | Parent word |
| content_en | TEXT | NOT NULL | English sentence |
| content_cn | TEXT | NOT NULL | Chinese translation |
| is_primary | BOOLEAN | DEFAULT false | Primary sentence for learning |
| audio_url | VARCHAR(500) | NULL | Sentence audio URL |
| sort_order | INTEGER | DEFAULT 0 | Display order |

**Indexes**:
- `idx_sentence_word` on (word_id)
- `idx_sentence_word_primary` on (word_id) WHERE is_primary = true

### 6. Card

FSRS learning card tracking user-word-module state.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → User | Card owner |
| word_id | UUID | FK → Word | Associated word |
| module_type | INTEGER | NOT NULL | Learning module (1-13) |
| status | ENUM | NOT NULL | 'new', 'learning', 'review', 'graduated' |
| stability | DECIMAL(10,4) | DEFAULT 0 | FSRS stability (days) |
| difficulty | DECIMAL(10,4) | DEFAULT 0 | FSRS difficulty (0-1) |
| due_at | TIMESTAMP | NULL | Next review due (precision: second) |
| last_review_at | TIMESTAMP | NULL | Last review timestamp |
| review_count | INTEGER | DEFAULT 0 | Total review count |
| error_count | INTEGER | DEFAULT 0 | Total error count |
| created_at | TIMESTAMP | NOT NULL | First learning timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

**Indexes**:
- `idx_card_user_due` on (user_id, due_at)
- `idx_card_user_module_due` on (user_id, module_type, due_at)
- `idx_card_user_word_module` UNIQUE on (user_id, word_id, module_type)

**Module Types** (from spec):
| ID | Name | Direction |
|----|------|-----------|
| 1 | 智能认词 | 形 → 义 |
| 2 | 智能听写 | 音 → 形 |
| 3 | 智能默写 | 义 → 形 |
| 4 | 智能听词 | 音 → 义 (后期) |
| 5 | 智能跟读 | 形 → 音 (后期) |
| 6 | 智能说词 | 义 → 音 (后期) |
| 7 | 智能用词 | 例句填空 |
| 8 | 例句听组 | 听音排序 |
| 9 | 例句翻译 | 中译英排序 |
| 10 | 例句听写 | 听音拼写 |
| 11 | 例句听力 | 听音选义 (后期) |
| 12 | 例句口语 | 跟读例句 (后期) |
| 13 | 例句默写 | 看中写英 (后期) |

**Status Transitions**:
```
new ──first learning──► learning ──FSRS reviews──► review ──graduation criteria──► graduated
                             │                        │
                             └────────error──────────►│
```

### 7. Revlog

Review log for FSRS optimization and analytics.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| card_id | UUID | FK → Card | Associated card |
| user_id | UUID | FK → User | User (denormalized for queries) |
| rating | INTEGER | NOT NULL | FSRS rating (0-4) |
| response_time_ms | INTEGER | NOT NULL | Time to answer (ms) |
| stability_before | DECIMAL(10,4) | NOT NULL | Stability before review |
| stability_after | DECIMAL(10,4) | NOT NULL | Stability after review |
| difficulty_before | DECIMAL(10,4) | NOT NULL | Difficulty before review |
| difficulty_after | DECIMAL(10,4) | NOT NULL | Difficulty after review |
| interval_before | INTEGER | NOT NULL | Days until this review |
| interval_after | INTEGER | NOT NULL | Days until next review |
| review_type | ENUM | NOT NULL | 'learning', 'review', 'relearning' |
| created_at | TIMESTAMP | NOT NULL | Review timestamp |

**Indexes**:
- `idx_revlog_card` on (card_id)
- `idx_revlog_user_date` on (user_id, created_at)

### 8. LearningSession

Tracks learning session progress for resume capability.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → User | Session owner |
| book_id | UUID | FK → Book | Current book |
| unit_number | INTEGER | NOT NULL | Current unit |
| module_type | INTEGER | NOT NULL | Current module |
| words_completed | INTEGER | DEFAULT 0 | Words done in session |
| words_total | INTEGER | NOT NULL | Total words in session |
| is_reinforcement | BOOLEAN | DEFAULT false | In 词义强化 phase |
| reinforcement_words | JSONB | NULL | Words pending reinforcement |
| status | ENUM | NOT NULL | 'active', 'paused', 'completed' |
| effective_seconds | INTEGER | DEFAULT 0 | Effective learning time |
| created_at | TIMESTAMP | NOT NULL | Session start |
| updated_at | TIMESTAMP | NOT NULL | Last activity |

**Indexes**:
- `idx_session_user_active` on (user_id) WHERE status = 'active'

### 9. TestAttempt

Records test attempts and results.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → User | Test taker |
| book_id | UUID | FK → Book | Tested book |
| unit_number | INTEGER | NOT NULL | Tested unit |
| module_type | INTEGER | NOT NULL | Tested module |
| test_mode | ENUM | NOT NULL | 'normal', 'speed', 'ultimate' |
| score | INTEGER | NOT NULL | Score (0-100) |
| total_questions | INTEGER | NOT NULL | Question count |
| correct_answers | INTEGER | NOT NULL | Correct count |
| time_spent_ms | INTEGER | NOT NULL | Total time taken |
| passed | BOOLEAN | NOT NULL | Score >= 90 |
| created_at | TIMESTAMP | NOT NULL | Attempt timestamp |

**Indexes**:
- `idx_test_user_book_unit_module` on (user_id, book_id, unit_number, module_type)

### 10. CoinTransaction

Tracks all coin movements.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → User | Coin owner |
| amount | INTEGER | NOT NULL | Positive = earn, negative = spend |
| balance_after | INTEGER | NOT NULL | Balance after transaction |
| type | ENUM | NOT NULL | Transaction type |
| reference_id | UUID | NULL | Related entity ID |
| description | VARCHAR(255) | NOT NULL | Human-readable description |
| created_at | TIMESTAMP | NOT NULL | Transaction timestamp |

**Transaction Types**:
- `learning_time`: 1 coin/minute
- `test_pass`: First-time test pass bonus
- `test_score_refresh`: New high score bonus
- `daily_login`: First login of day
- `monthly_streak`: Cumulative login rewards
- `birthday`: Birthday bonus
- `pk_win`: PK victory
- `pk_loss`: PK defeat (negative)
- `review_lottery`: 复习红包

**Indexes**:
- `idx_coin_user_date` on (user_id, created_at)
- `idx_coin_user_type_date` on (user_id, type, created_at)

### 11. UserBook

Tracks user's relationship with vocabulary books.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → User | User |
| book_id | UUID | FK → Book | Book |
| is_current | BOOLEAN | DEFAULT false | Currently selected book |
| unit_progress | JSONB | NOT NULL | Progress per unit |
| created_at | TIMESTAMP | NOT NULL | First selection |
| updated_at | TIMESTAMP | NOT NULL | Last activity |

**JSONB Structure for unit_progress**:
```json
{
  "1": {
    "modules": {
      "1": {"status": "passed", "stars": 2, "best_score": 95},
      "2": {"status": "learning", "stars": 0, "best_score": null}
    }
  }
}
```

**Indexes**:
- `idx_userbook_user` on (user_id)
- `idx_userbook_user_current` on (user_id) WHERE is_current = true

## Validation Rules

### User
- Email format validation (RFC 5322)
- Phone format: E.164 international format
- Username: 2-50 characters, alphanumeric + Chinese
- Birthday: Must be in the past

### Card
- Due date precision: second-level
- Stability/Difficulty: 4 decimal places
- One card per (user, word, module) combination

### Coin Transactions
- Daily learning coin cap: 500 (sum of type='learning_time')
- Amount must be non-zero
- Balance must never go negative

### Test Attempts
- Score range: 0-100
- Pass threshold: 90
- One attempt record per test completion

## Data Retention

| Data Type | Retention Period | Purge Strategy |
|-----------|------------------|----------------|
| Guest data (Cards, Revlog) | 30 days | Daily job, delete by device_fingerprint age |
| Revlog (registered users) | Indefinite | Archive to cold storage after 1 year |
| Learning sessions | 30 days | Delete completed sessions after 30 days |
| Coin transactions | Indefinite | Archive to cold storage after 1 year |
