# Trip Processor — SDE2 Engineering Challenge

> **Time limit**: 4 hours from when you fork this repo  
> **Level**: SDE2 (3–5 years experience)  
> **Stack**: TypeScript, Node.js, Express — no AWS, no databases, no external services

---

## Context

You've been handed a trip event processor mid-sprint. A previous engineer started it, but left some bugs and two unimplemented endpoints. Your job: ship it.

The service processes lifecycle events for vehicle trips (`TRIP_STARTED`, `TRIP_COMPLETED`, `TRIP_CANCELLED`), deduplicates them, stores them in memory, and exposes a REST API.

---

## Your Tasks

Work through these in order — later tasks build on earlier ones.

### 1. Fix the Bugs (24 points)

Run the tests:

```bash
npm install
npm test
```

You will see failing tests tagged `[BUG]`. There are **3 bugs** planted in `src/processor.ts`. Find and fix them.

Rules:
- You may **not** modify the assertions in existing tests
- You may only fix bugs in `src/processor.ts`
- Do not change `src/db.ts` or `src/types.ts`

### 2. Implement the Missing Endpoints (24 points)

Two endpoints in `src/api.ts` return `501 Not Implemented`. Make the `[FEAT]` tests pass by implementing them:

- `GET /events` — list all events, with optional `?driverId=` filter
- `POST /events/bulk` — accept and process an array of events

### 3. Write Edge Case Tests (20 points)

`tests/edge-cases.test.ts` is empty. Write **at least 5 tests** for scenarios you think are important for a production system.

There are no prescribed edge cases — we're evaluating *which* scenarios you identified as risky and *whether* your tests correctly verify the behaviour. Make them pass.

### 4. Fill in SUBMISSION.md (5 points)

Answer the questions in `SUBMISSION.md`. Be honest — especially about AI tool usage.

---

## Getting Started

```bash
# 1. Fork this repo on GitHub (do not clone directly)
# 2. Clone your fork
git clone https://github.com/<your-username>/trip-processor-challenge
cd trip-processor-challenge

# 3. Install
npm install

# 4. Run tests (watch mode while you work)
npm run test:watch

# 5. When done, push to your fork and open a PR to the submissions branch
```

---

## Submitting

1. Push your changes to your fork
2. Open a Pull Request from your fork to the `submissions` branch of this repo
3. The CI bot will post your automated score as a PR comment within 2 minutes
4. You're done — don't wait for the score before submitting

---

## Rules

| ✅ Allowed | ❌ Not allowed |
|---|---|
| Any AI coding assistant | Modifying existing test assertions |
| Any npm packages | Changing `src/db.ts` or `src/types.ts` |
| Google, Stack Overflow | Collaborating with other people |
| Multiple commits | Submitting after the 4-hour window |

---

## Project Structure

```
src/
  types.ts        — Data model (read-only)
  db.ts           — In-memory store (read-only)
  processor.ts    — Core logic — has bugs, fix here
  api.ts          — REST API — has missing endpoints, implement here

tests/
  processor.test.ts   — Unit tests for processor (do not modify assertions)
  api.test.ts         — API tests (do not modify assertions)
  edge-cases.test.ts  — EMPTY — write your tests here

JUDGING.md    — Full scoring rubric (read before you start)
SUBMISSION.md — Fill this in before submitting
```

---

## Local Dev

```bash
npm test            # run all tests once
npm run test:watch  # watch mode
npm run typecheck   # TypeScript check only
```

No server to run — all tests use supertest (in-process HTTP).

---

## Questions?

If something is genuinely ambiguous, open a GitHub Discussion on this repo. Do not email.
