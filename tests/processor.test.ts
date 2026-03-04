import { describe, test, expect, beforeEach } from 'vitest';
import { TripProcessor } from '../src/processor';
import { EventStore } from '../src/db';
import { TripEvent } from '../src/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeEvent(overrides: Partial<TripEvent> = {}): TripEvent {
  return {
    eventId: 'evt-001',
    tripId: 'trip-001',
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

// ─────────────────────────────────────────────────────────────────────────────
// [REG] Validation — these tests must pass before and after your changes
// ─────────────────────────────────────────────────────────────────────────────

describe('[REG] Input validation', () => {
  test('should reject event with missing eventId', () => {
    const result = processor.process(makeEvent({ eventId: '' }));
    expect(result.accepted).toBe(false);
    expect(result.reason).toBe('invalid');
  });

  test('should reject event with missing driverId', () => {
    const result = processor.process(makeEvent({ driverId: '' }));
    expect(result.accepted).toBe(false);
    expect(result.reason).toBe('invalid');
  });

  test('should reject event with missing type', () => {
    const result = processor.process(makeEvent({ type: '' as any }));
    expect(result.accepted).toBe(false);
    expect(result.reason).toBe('invalid');
  });

  test('should accept a valid TRIP_STARTED event', () => {
    const result = processor.process(makeEvent());
    expect(result.accepted).toBe(true);
    expect(result.eventId).toBe('evt-001');
  });

  test('should return zeroed stats for an unknown driver', () => {
    const stats = processor.getStats('nobody');
    expect(stats.totalTrips).toBe(0);
    expect(stats.completedTrips).toBe(0);
    expect(stats.completionRate).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// [BUG] Deduplication — fix the dedup logic in processor.ts
// ─────────────────────────────────────────────────────────────────────────────

describe('[BUG] Deduplication', () => {
  test('should accept TRIP_COMPLETED after TRIP_STARTED for the same trip', () => {
    processor.process(makeEvent({ eventId: 'e-start', tripId: 'T1', type: 'TRIP_STARTED' }));
    const result = processor.process(makeEvent({ eventId: 'e-complete', tripId: 'T1', type: 'TRIP_COMPLETED', durationMs: 5000, distanceKm: 3 }));
    expect(result.accepted).toBe(true);
  });

  test('should accept TRIP_CANCELLED after TRIP_STARTED for the same trip', () => {
    processor.process(makeEvent({ eventId: 'e-start', tripId: 'T1', type: 'TRIP_STARTED' }));
    const result = processor.process(makeEvent({ eventId: 'e-cancel', tripId: 'T1', type: 'TRIP_CANCELLED' }));
    expect(result.accepted).toBe(true);
  });

  test('should reject a duplicate eventId submitted twice', () => {
    const event = makeEvent({ eventId: 'e-dup', tripId: 'T1' });
    processor.process(event);
    const result = processor.process({ ...event, tripId: 'T-other' }); // same eventId, different tripId
    expect(result.accepted).toBe(false);
    expect(result.reason).toBe('duplicate');
  });

  test('processAll: should accept all three lifecycle events for a single trip', () => {
    const events: TripEvent[] = [
      makeEvent({ eventId: 'e1', tripId: 'T1', type: 'TRIP_STARTED', timestamp: 1000 }),
      makeEvent({ eventId: 'e2', tripId: 'T1', type: 'TRIP_COMPLETED', timestamp: 2000, durationMs: 1000, distanceKm: 5 }),
    ];
    const results = processor.processAll(events);
    expect(results[0].accepted).toBe(true);
    expect(results[1].accepted).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// [BUG] Stats: completion — fix the type comparison in getStats
// These tests seed the store directly so they are independent of the dedup bug
// ─────────────────────────────────────────────────────────────────────────────

describe('[BUG] Stats — completion counting', () => {
  beforeEach(() => {
    // Seed directly to bypass dedup
    store.save({ eventId: 'e1', tripId: 'T1', driverId: 'D1', type: 'TRIP_STARTED',   timestamp: 1000 });
    store.save({ eventId: 'e2', tripId: 'T1', driverId: 'D1', type: 'TRIP_COMPLETED', timestamp: 2000, durationMs: 60_000, distanceKm: 5 });
    store.save({ eventId: 'e3', tripId: 'T2', driverId: 'D1', type: 'TRIP_STARTED',   timestamp: 3000 });
    store.save({ eventId: 'e4', tripId: 'T2', driverId: 'D1', type: 'TRIP_CANCELLED', timestamp: 4000 });
  });

  test('should count completed trips correctly', () => {
    const stats = processor.getStats('D1');
    expect(stats.completedTrips).toBe(1);
  });

  test('should compute completion rate correctly (1 completed / 2 started = 0.5)', () => {
    const stats = processor.getStats('D1');
    expect(stats.completionRate).toBe(0.5);
  });

  test('should sum total distance across completed trips only', () => {
    const stats = processor.getStats('D1');
    expect(stats.totalDistanceKm).toBe(5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// [BUG] Stats: average duration — fix the divisor in avgDurationMs calculation
// ─────────────────────────────────────────────────────────────────────────────

describe('[BUG] Stats — average duration', () => {
  test('should compute avgDurationMs using only completed trips, not all events', () => {
    // 1 completed trip (60s) + 2 other events = wrong if dividing by 3
    store.save({ eventId: 'e1', tripId: 'T1', driverId: 'D2', type: 'TRIP_STARTED',   timestamp: 1000 });
    store.save({ eventId: 'e2', tripId: 'T1', driverId: 'D2', type: 'TRIP_COMPLETED', timestamp: 2000, durationMs: 60_000, distanceKm: 3 });
    store.save({ eventId: 'e3', tripId: 'T2', driverId: 'D2', type: 'TRIP_STARTED',   timestamp: 3000 });
    store.save({ eventId: 'e4', tripId: 'T2', driverId: 'D2', type: 'TRIP_CANCELLED', timestamp: 4000 });

    const stats = processor.getStats('D2');
    // Correct: 60_000 / 1 = 60_000 ms
    // Buggy:   60_000 / 4 = 15_000 ms
    expect(stats.avgDurationMs).toBe(60_000);
  });

  test('should return avgDurationMs of 0 when driver has no completed trips', () => {
    store.save({ eventId: 'e1', tripId: 'T1', driverId: 'D3', type: 'TRIP_STARTED', timestamp: 1000 });
    const stats = processor.getStats('D3');
    expect(stats.avgDurationMs).toBe(0);
  });
});
