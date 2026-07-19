# Mock24hr Engineering Handbook

> Version 1.0 — Based on Document 10

## Quick Reference

### Architecture Layers

```
Presentation Layer (Pages)
        ↓
Page Controller (orchestrates)
        ↓
Feature Service (business logic)
        ↓
Business Engine (pure logic)
        ↓
Storage / API (persistence)
```

**Rule:** Pages orchestrate. Engines compute. Storage persists.

---

### EventBus Conventions (§8, §21)

Event names: **lowercase, underscores, past tense**

```
mock_completed
question_bookmarked
flashcard_reviewed
paper_generated
revision_completed
achievement_unlocked
plan_changed
profile_updated
```

**Every page should subscribe, not poll.**

---

### State Management (§9)

| Layer | Example | Lifetime |
|-------|---------|----------|
| UI State | Modal open, tab selected | Component lifetime |
| Session State | Current test, current exam | Tab/session |
| Persistent State | History, profile, bookmarks | localStorage |

**Never mix these layers.**

---

### Storage Keys

All keys must be registered in `Storage.ALL_KEYS` (storage.js).
Engines may define their own `STORAGE_KEY` constant but Storage must know about them for cleanup.

Naming convention:
- Core: `mocktest_*`
- Platform: `mtp_*`

---

### Error Handling (§11)

**Never show raw errors to users.**

Bad: `500 Internal Server Error`
Good: `Unable to load today's recommendations. [Retry]`

Log technical details with `console.warn()` silently.

---

### Performance Budgets (§12)

| Target | Budget |
|--------|--------|
| Homepage first render | < 2.5s |
| JS payload (initial) | < 250 KB |
| CSS (critical path) | < 80 KB |
| Dashboard interactive | < 2s |
| Question navigation | < 100ms |

---

### Accessibility Checklist (§14)

Every feature must support:
- [ ] Keyboard navigation
- [ ] Focus visibility
- [ ] Screen readers (aria-labels)
- [ ] Color-independent status
- [ ] Reduced motion (`prefers-reduced-motion`)
- [ ] Zoom to 200%
- [ ] Touch targets ≥ 44px

---

### Feature Flags (§25)

Every premium or experimental feature behind `FeatureFlags.can('FEATURE_NAME')`.
Never hardcode plan checks like `if (plan === 'pro')` in page code.

---

### Definition of Done (§31)

A feature is complete when ALL of these are true:
- [ ] Functional requirements implemented
- [ ] Matches design system (tokens, not hardcoded values)
- [ ] Responsive
- [ ] Accessible
- [ ] Uses shared components
- [ ] Emits required EventBus events
- [ ] Handles loading, empty, and error states
- [ ] Uses RecommendationEngine for any recommendation logic
- [ ] Meets performance budgets
- [ ] Documented in changelog

---

### New Feature Checklist (§32)

Before building, answer:
1. Does it reuse existing components?
2. Does it fit the information architecture?
3. Does it integrate with the EventBus?
4. Does it improve the student's preparation?
5. Can another developer understand and extend it in 6 months?

If all five → **yes**, the feature belongs in Mock24hr.
