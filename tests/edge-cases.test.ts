import { describe, test, expect, beforeEach } from 'vitest';
import { TripProcessor } from '../src/processor';
import { EventStore } from '../src/db';
import { TripEvent } from '../src/types';

/**
 * EDGE CASES — Your task
 *
 * This file is empty. Write at least 5 tests for scenarios YOU think matter.
 *
 * A few areas worth thinking about (not exhaustive):
 *   - What happens when events arrive out of order?
 *   - What happens when the same trip generates multiple events of the same type?
 *   - What happens at the boundaries of numeric fields (0, negative, very large)?
 *   - Are stats consistent with each other, or can they contradict?
 *   - What does the system do under bulk load with mixed valid and invalid data?
 *
 * Strong edge cases catch real bugs. Weak ones test things that obviously work.
 * We will read every test you write and discuss them in the debrief.
 */

function makeEvent(overrides: Partial<TripEvent> = {}): TripEvent {
  return {
    eventId: `evt-${Math.random().toString(36).slice(2, 8)}`,
    tripId: `trip-${Math.random().toString(36).slice(2, 8)}`,
    driverId: 'driver-001',
    type: 'TRIP_STARTED',
    timestamp: Date.now(),
    ...overrides,
  };
}

let store: EventStore;
let processor: TripProcessor;

beforeEach(() => {
  store = new EventStore();
  processor = new TripProcessor(store);
});

// Write your tests below
// describe('[EDGE] ...', () => { ... });
