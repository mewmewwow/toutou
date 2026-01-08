* [ ] 
  ```
  <!--
  Sync Impact Report:
  - Version change: 0.0.0 -> 1.0.0 (initial ratification)
  - Added principles:
    * I. Code Style Consistency
    * II. Critical Logic Testing
    * III. Simple & Maintainable Architecture
    * IV. Clear Error Handling
    * V. Performance Standards
  - Added sections:
    * Performance Standards (with specific thresholds)
    * Principle-Process Constraints (how principles bind plan/implement)
  - Templates requiring updates:
    * .specify/templates/plan-template.md (updated)
    * .specify/templates/spec-template.md (updated)
    * .specify/templates/tasks-template.md (updated)
  - Follow-up TODOs: None
  -->
  ```

# Toutou Project Constitution

## Core Principles

### I. Code Style Consistency

**Rules**:

- All code MUST follow a single, project-wide style guide
- Linting and formatting tools MUST be configured and enforced in CI/CD
- Code MUST be auto-formatted before commit (pre-commit hook REQUIRED)
- Style violations MUST block merge/merge requests

**Rationale**: Consistent code style reduces cognitive load, enables faster code reviews, and prevents trivial style debates. When code looks familiar, developers focus on logic, not formatting.

**Constraints on Plan/Implement**:

- `/speckit.plan` MUST specify linting/formatting tools in Technical Context
- `/speckit.implement` MUST configure linting in Phase 1 (Setup) before any feature code
- Any generated code MUST pass configured linters

### II. Critical Logic Testing (NON-NEGOTIABLE)

**Rules**:

- All critical business logic MUST have automated tests
- Critical paths include: authentication, payment, data mutation, external integrations
- Tests MUST be written BEFORE implementation (TDD for critical paths)
- Test coverage for critical logic MUST be >= 80%

**Rationale**: Critical logic failures cause the most severe user impact. Tests serve as living documentation and safety nets for refactoring.

**Constraints on Plan/Implement**:

- `/speckit.plan` MUST identify critical paths in Constitution Check
- `/speckit.tasks` MUST include test tasks for critical paths, marked to run BEFORE implementation
- `/speckit.implement` MUST NOT mark critical logic tasks complete without passing tests

### III. Simple & Maintainable Architecture

**Rules**:

- Prefer simple solutions over clever ones (YAGNI principle enforced)
- Each module MUST have a single, clear responsibility
- Direct solutions preferred over patterns/abstractions unless justified
- Any design pattern MUST be documented with "why" in comments

**Rationale**: Complexity is the enemy of maintainability. Simple code is easier to understand, debug, and modify. Premature abstraction creates indirection without benefit.

**Constraints on Plan/Implement**:

- `/speckit.plan` MUST document rejected simpler alternatives in Complexity Tracking
- `/speckit.plan` MUST error if patterns are introduced without justification
- `/speckit.implement` MUST prefer straightforward implementations over framework-heavy alternatives

### IV. Clear Error Handling

**Rules**:

- All public interfaces (API, CLI, library functions) MUST define error cases
- Errors MUST include: error code, human-readable message, actionable context
- Internal errors MUST be logged; users MUST receive sanitized messages
- Error handling MUST be tested alongside happy path

**Rationale**: Unclear errors waste debugging time. Good error handling transforms failures into actionable guidance.

**Constraints on Plan/Implement**:

- `/speckit.plan` MUST define error contracts in contracts/
- `/speckit.tasks` MUST include error handling test tasks
- `/speckit.implement` MUST implement error paths before happy path completion

### V. Performance Standards

**Rules**:

- **API endpoints**: p95 latency < 500ms, p99 < 1000ms
- **Frontend首屏 (First Contentful Paint)**: < 2 seconds on 4G
- **Frontend可交互 (Time to Interactive)**: < 3 seconds on 4G
- **Database queries**: Single query < 100ms (hot path)
- Performance tests REQUIRED for any endpoint serving user traffic

**Rationale**: Performance is a feature. Slow interfaces frustrate users and increase abandonment. These thresholds are minimum bars for usability.

**Constraints on Plan/Implement**:

- `/speckit.specify` MUST include performance criteria in Success Criteria when applicable
- `/speckit.plan` MUST document performance goals in Technical Context
- `/speckit.tasks` MUST include performance test tasks for user-facing features
- `/speckit.implement` MUST flag violations; complexity MUST be justified if thresholds exceeded

## Principle-Process Constraints

This section explicitly describes how principles constrain the SpecKit workflow:

### Constraints on `/speckit.plan`

| Principle      | Plan Phase Requirement                                                                                                       |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Code Style     | Technical Context MUST specify linter/formatter; Constitution Check validates tool selection                                 |
| Testing        | Constitution Check MUST identify critical paths requiring tests; Complexity Tracking for any untested critical path is ERROR |
| Simplicity     | Complexity Tracking table REQUIRED for any abstractions/patterns; rejected simpler alternatives documented                   |
| Error Handling | contracts/ MUST define error schemas for all endpoints; Constitution Check validates coverage                                |
| Performance    | Performance Goals REQUIRED in Technical Context; thresholds above are default minimums                                       |

### Constraints on `/speckit.implement`

| Principle      | Implement Phase Requirement                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------ |
| Code Style     | Linter MUST pass before task marked complete; format-on-save or pre-commit hook REQUIRED                     |
| Testing        | Critical logic tests MUST fail, then pass (Red-Green) before implementation task marked complete             |
| Simplicity     | Any new abstraction requires inline comment "Why: [reason]" explaining what simple approach was insufficient |
| Error Handling | Error cases MUST be implemented and tested before feature marked complete                                    |
| Performance    | Performance tests MUST pass for user-facing features; violations trigger explicit user notification          |

## Governance

### Amendment Procedure

1. Propose amendment with rationale
2. Document impact on plan/implement workflows
3. Update this constitution with version bump (semantic versioning)
4. Reconcile dependent templates (plan, spec, tasks)

### Versioning Policy

- **MAJOR**: Remove or redefine non-negotiable principles
- **MINOR**: Add new principle or materially expand guidance
- **PATCH**: Clarifications, wording improvements, non-semantic changes

### Compliance Review

- All PRs SHOULD reference relevant principles
- Constitution violations MUST be documented in Complexity Tracking
- Simplicity violations without justification MUST be rejected

**Version**: 1.0.0 | **Ratified**: 2025-12-27 | **Last Amended**: 2025-12-27
