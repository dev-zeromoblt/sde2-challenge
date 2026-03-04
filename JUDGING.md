# Judging Rubric — Trip Processor Challenge

Total: **100 points** (83 automated + 17 manual)

---

## Automated (83 points)

Scores are computed by CI on every push. Posted as a PR comment.

### Bug Fixes — 24 points
- 8 tests tagged `[BUG]`, worth 3 points each
- Tests cover: deduplication correctness, completion counting, average duration calculation

### Feature Implementation — 24 points
- 8 tests tagged `[FEAT]`, worth 3 points each
- Tests cover: `GET /events` (list + filter) and `POST /events/bulk` (batch processing)

### Edge Case Tests — 20 points
- Scored on tests written in `tests/edge-cases.test.ts`
- 4 points per passing test, up to 5 tests scored (max 20 points)
- Tests must pass — a test that exists but fails scores 0

### No Regressions — 10 points
- 5 tests tagged `[REG]` that pass at the start of the challenge
- 2 points each for keeping them passing
- Breaking a previously-passing test costs you points here

### SUBMISSION.md — 5 points
- Must be meaningfully filled in (not the template placeholder text)
- Must answer all four questions

---

## Manual (17 points)

Reviewed by the hiring team after automated scoring.

### Code Quality — 7 points

| Score | Bar |
|---|---|
| 7 | Clean, well-named, no unnecessary complexity. Easy to read without explanation. |
| 5 | Minor issues: slightly confusing names, small duplication, unclear logic in 1-2 places |
| 3 | Readable but has noticeable issues: magic numbers, nested conditionals, unclear intent |
| 1 | Hard to follow without significant context |

### Commit History — 4 points

| Score | Bar |
|---|---|
| 4 | Multiple commits with clear messages. History tells the story of how you worked. |
| 2 | Some commits but too large or messages are vague ("fix", "update", "wip") |
| 0 | Single commit with everything in it |

### Edge Case Choices — 6 points

This is the most important manual dimension. We're looking at *which* edge cases you chose, not just *how many*.

| Score | Bar |
|---|---|
| 6 | Chose scenarios that would actually cause production incidents (concurrency, ordering, bad data at boundaries, partial failures) |
| 4 | Mostly good choices, one or two are too obvious or redundant |
| 2 | Edge cases are variations of the happy path — nothing surprising |
| 0 | Edge cases are copy-pastes of existing tests with minor changes |

---

## What We're Not Scoring

- Speed (within the 4-hour window)
- Perfect TypeScript types on new code
- Fancy npm packages
- Style preferences (tabs vs spaces, etc.)

---

## Debrief (After Submission)

A 15-minute call will follow submission. We'll ask:

- "Walk me through the three bugs — how did you identify them?"
- "Which edge case was most important to you, and why?"
- "You used AI for [X] — explain what that code does in your own words."
- "What would you add if this were going to production?"

The debrief is not scored — but it's where we learn the most.
