# Error Codes: 词善佳 (CiShanJia) API

**Version**: 1.0.0
**Date**: 2026-01-07

## Error Response Format

All errors follow this JSON structure:

```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable message in Chinese",
  "details": {
    // Optional additional context
  }
}
```

## Error Code Categories

| Prefix | Category | HTTP Status Range |
|--------|----------|-------------------|
| `AUTH_` | Authentication & Authorization | 401, 403 |
| `VAL_` | Validation | 400 |
| `USER_` | User Management | 400, 404, 409 |
| `BOOK_` | Vocabulary Books | 403, 404 |
| `LEARN_` | Learning Sessions | 400, 404, 409 |
| `REVIEW_` | Review System | 400, 409 |
| `TEST_` | Testing System | 400, 409 |
| `REWARD_` | Rewards System | 400, 409 |
| `RATE_` | Rate Limiting | 429 |
| `SYS_` | System Errors | 500 |

---

## Authentication Errors (AUTH_)

| Code | HTTP | Message | Details |
|------|------|---------|---------|
| `AUTH_INVALID_CREDENTIALS` | 401 | 用户名或密码错误 | - |
| `AUTH_TOKEN_EXPIRED` | 401 | 登录已过期，请重新登录 | `{ expiredAt: ISO8601 }` |
| `AUTH_TOKEN_INVALID` | 401 | 无效的登录凭证 | - |
| `AUTH_REFRESH_TOKEN_INVALID` | 401 | 刷新令牌无效或已过期 | - |
| `AUTH_DEVICE_LIMIT_EXCEEDED` | 403 | 设备数量超过限制（最多3台） | `{ currentDevices: number, limit: 3 }` |
| `AUTH_DEVICE_NOT_VERIFIED` | 403 | 新设备需要验证 | `{ requiresVerification: true }` |
| `AUTH_MONTHLY_DEVICE_LIMIT` | 403 | 本月新设备添加次数已达上限 | `{ usedThisMonth: number, limit: 5 }` |
| `AUTH_SMS_CODE_INVALID` | 401 | 验证码错误或已过期 | - |
| `AUTH_SMS_CODE_EXPIRED` | 401 | 验证码已过期，请重新获取 | - |
| `AUTH_OAUTH_FAILED` | 401 | 第三方登录失败 | `{ provider: string }` |
| `AUTH_GUEST_NOT_FOUND` | 404 | 未找到游客数据 | `{ fingerprint: string }` |

---

## Validation Errors (VAL_)

| Code | HTTP | Message | Details |
|------|------|---------|---------|
| `VAL_INVALID_EMAIL` | 400 | 邮箱格式不正确 | `{ field: "email" }` |
| `VAL_INVALID_PHONE` | 400 | 手机号格式不正确 | `{ field: "phone" }` |
| `VAL_PASSWORD_TOO_WEAK` | 400 | 密码强度不足（至少8位） | `{ minLength: 8 }` |
| `VAL_USERNAME_TOO_SHORT` | 400 | 用户名至少2个字符 | `{ minLength: 2 }` |
| `VAL_USERNAME_TOO_LONG` | 400 | 用户名最多50个字符 | `{ maxLength: 50 }` |
| `VAL_REQUIRED_FIELD` | 400 | 缺少必填字段 | `{ field: string }` |
| `VAL_INVALID_UUID` | 400 | 无效的ID格式 | `{ field: string }` |
| `VAL_INVALID_MODULE_TYPE` | 400 | 无效的学习模块类型 | `{ validRange: "1-13" }` |
| `VAL_INVALID_TEST_MODE` | 400 | 无效的测试模式 | `{ validModes: ["normal", "speed", "ultimate"] }` |
| `VAL_INVALID_RATING` | 400 | 无效的评分（0-4） | `{ validRange: "0-4" }` |

---

## User Errors (USER_)

| Code | HTTP | Message | Details |
|------|------|---------|---------|
| `USER_EMAIL_EXISTS` | 409 | 该邮箱已被注册 | - |
| `USER_PHONE_EXISTS` | 409 | 该手机号已被注册 | - |
| `USER_NOT_FOUND` | 404 | 用户不存在 | - |
| `USER_TRIAL_EXPIRED` | 403 | 试用期已结束，请升级会员 | `{ expiredAt: ISO8601, upgradeUrl: string }` |
| `USER_MEMBERSHIP_REQUIRED` | 403 | 此功能需要会员权限 | `{ requiredType: "paid" }` |

---

## Book Errors (BOOK_)

| Code | HTTP | Message | Details |
|------|------|---------|---------|
| `BOOK_NOT_FOUND` | 404 | 词书不存在 | `{ bookId: string }` |
| `BOOK_UNIT_NOT_FOUND` | 404 | 单元不存在 | `{ bookId: string, unitNumber: number }` |
| `BOOK_UNIT_LOCKED` | 403 | 该单元需要会员权限解锁 | `{ unitNumber: number, accessibleUnits: [1] }` |
| `BOOK_ACCESS_DENIED` | 403 | 无权访问此词书 | `{ bookId: string, isFree: boolean }` |

---

## Learning Errors (LEARN_)

| Code | HTTP | Message | Details |
|------|------|---------|---------|
| `LEARN_SESSION_NOT_FOUND` | 404 | 学习会话不存在或已结束 | `{ sessionId: string }` |
| `LEARN_SESSION_EXPIRED` | 400 | 学习会话已过期 | `{ lastActiveAt: ISO8601 }` |
| `LEARN_WORD_NOT_IN_SESSION` | 400 | 该单词不在当前学习会话中 | `{ wordId: string }` |
| `LEARN_ALREADY_SUBMITTED` | 409 | 该单词已提交过答案 | `{ wordId: string }` |
| `LEARN_REINFORCEMENT_REQUIRED` | 400 | 请先完成词义强化 | `{ pendingWords: number }` |

---

## Review Errors (REVIEW_)

| Code | HTTP | Message | Details |
|------|------|---------|---------|
| `REVIEW_BLOCKING` | 409 | 待复习单词过多，请先完成复习 | `{ overdueCount: number, threshold: 25 }` |
| `REVIEW_CARD_NOT_FOUND` | 404 | 学习卡片不存在 | `{ cardId: string }` |
| `REVIEW_CARD_NOT_DUE` | 400 | 该卡片尚未到复习时间 | `{ dueAt: ISO8601 }` |
| `REVIEW_ALREADY_GRADUATED` | 400 | 该单词已毕业，无需复习 | `{ wordId: string, moduleType: number }` |

---

## Test Errors (TEST_)

| Code | HTTP | Message | Details |
|------|------|---------|---------|
| `TEST_SESSION_NOT_FOUND` | 404 | 测试会话不存在 | `{ testId: string }` |
| `TEST_SESSION_EXPIRED` | 400 | 测试已超时 | `{ expiredAt: ISO8601 }` |
| `TEST_ALREADY_SUBMITTED` | 409 | 测试已提交 | `{ testId: string }` |
| `TEST_INCOMPLETE_ANSWERS` | 400 | 答案不完整 | `{ expected: number, received: number }` |
| `TEST_REVIEW_REQUIRED` | 409 | 请先完成待复习单词的学习 | `{ overdueCount: number }` |

---

## Reward Errors (REWARD_)

| Code | HTTP | Message | Details |
|------|------|---------|---------|
| `REWARD_MILESTONE_NOT_REACHED` | 400 | 未达到领取条件 | `{ required: number, current: number }` |
| `REWARD_ALREADY_CLAIMED` | 409 | 奖励已领取 | `{ milestone: number, claimedAt: ISO8601 }` |
| `REWARD_DAILY_CAP_REACHED` | 400 | 今日学习金币已达上限 | `{ cap: 500, earned: number }` |
| `REWARD_INSUFFICIENT_COINS` | 400 | 金币余额不足 | `{ required: number, balance: number }` |

---

## Rate Limit Errors (RATE_)

| Code | HTTP | Message | Details |
|------|------|---------|---------|
| `RATE_LIMIT_EXCEEDED` | 429 | 请求过于频繁，请稍后再试 | `{ retryAfter: seconds, limit: number, window: "minute" }` |
| `RATE_SMS_LIMIT` | 429 | 短信发送过于频繁 | `{ retryAfter: seconds }` |
| `RATE_LOGIN_LIMIT` | 429 | 登录尝试次数过多 | `{ retryAfter: seconds, lockoutMinutes: number }` |

---

## System Errors (SYS_)

| Code | HTTP | Message | Details |
|------|------|---------|---------|
| `SYS_INTERNAL_ERROR` | 500 | 系统错误，请稍后再试 | `{ requestId: string }` |
| `SYS_DATABASE_ERROR` | 500 | 数据库错误 | `{ requestId: string }` |
| `SYS_EXTERNAL_SERVICE_ERROR` | 502 | 外部服务暂时不可用 | `{ service: string, requestId: string }` |
| `SYS_MAINTENANCE` | 503 | 系统维护中 | `{ estimatedEndTime: ISO8601 }` |

---

## Error Handling Guidelines

### Client-Side Handling

1. **Always check `code` field** for programmatic handling
2. **Display `message` to users** (already in Chinese)
3. **Log `details` for debugging** when available
4. **Implement retry logic** for 429 and 5xx errors

### Recommended Retry Strategy

```typescript
const retryConfig = {
  429: { maxRetries: 3, backoff: 'exponential', baseDelay: 1000 },
  500: { maxRetries: 2, backoff: 'exponential', baseDelay: 2000 },
  502: { maxRetries: 3, backoff: 'linear', baseDelay: 3000 },
  503: { maxRetries: 0, showMaintenanceUI: true },
};
```

### Special Handling Cases

| Scenario | Action |
|----------|--------|
| `AUTH_TOKEN_EXPIRED` | Attempt token refresh, then retry original request |
| `AUTH_DEVICE_LIMIT_EXCEEDED` | Show device management UI |
| `REVIEW_BLOCKING` | Redirect to review page |
| `USER_TRIAL_EXPIRED` | Show upgrade prompt |
| `BOOK_UNIT_LOCKED` | Show upgrade prompt with unit preview |
