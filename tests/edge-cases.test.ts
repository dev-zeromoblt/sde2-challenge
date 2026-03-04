import { describe, test, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/api';
import { EventStore } from '../src/db';
import { TripProcessor } from '../src/processor';
import { TripEvent } from '../src/types';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * EDGE CASES — Your turn
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * This file is intentionally empty.
 *
 * Write at least 5 tests that cover edge cases YOU think are important
 * for a production trip event processor.
 *
 * There are no "correct" edge cases — we're evaluating:
 *   - Which scenarios you identified as risky or important
 *   - Whether your tests actually verify the right behaviour
 *   - Whether your tests pass after fixing the bugs
 *
 * Guidelines:
 *   - Each test must have a clear name that explains the scenario
 *   - Tests should be independent (use beforeEach to reset state)
 *   - You may test the processor, the API, or both
 *   - Do not modify the existing tests in the other files
 *
 * Helpers available (copy as needed):
 *
 *   function makeEvent(overrides = {}): TripEvent { ... }
 *
 *   let store: EventStore;
 *   let processor: TripProcessor;
 *   let app: ReturnType<typeof createApp>;
 *
 *   beforeEach(() => {
 *     store = new EventStore();
 *     processor = new TripProcessor(store);
 *     app = createApp(store);
 *   });
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

// Write your tests below this line.
// Minimum: 5 tests. No maximum.
