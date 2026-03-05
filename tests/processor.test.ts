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
// [REG] Validation — these must pass before and after your changes
// ─────────────────────────────────────────────────────────────────────────────

describe('[REG] Input validation', () => {
  test('should reject an event with no eventId', () => {
    const result = processor.process(makeEvent({ eventId: '' }));
    expect(result.accepted).toBe(false);
    expect(result.reason).toBe('invalid');
  });

  test('should reject an event with no driverId', () => {
    const result = processor.process(makeEvent({ driverId: '' }));
    expect(result.accepted).toBe(false);
    expect(result.reason).toBe('invalid');
  });

  test('should reject an event with no type', () => {
    const result = processor.process(makeEvent({ type: '' as any }));
    expect(result.accepted).toBe(false);
    expect(result.reason).toBe('invalid');
  });

  test('should accept a well-formed TRIP_STARTED event', () => {
    const result = processor.process(makeEvent());
    expect(result.accepted).toBe(true);
    expect(result.eventId).toBe('evt-001');
  });

  test('should return zeroed stats for a driver with no events', () => {
    const stats = processor.getStats('nobody');
    expect(stats.totalTrips).toBe(0);
    expect(stats.completedTrips).toBe(0);
    expect(stats.completionRate).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// [BUG] Deduplication — something is wrong with how events are de-duplicated
// ─────────────────────────────────────────────────────────────────────────────

describe('[BUG] Deduplication', () => {
  test('all events in a trip lifecycle should be stored', () => {
    processor.process(makeEvent({ eventId: 'e-start',    tripId: 'T1', type: 'TRIP_STARTED' }));
    const result = processor.process(makeEvent({ eventId: 'e-complete', tripId: 'T1', type: 'TRIP_COMPLETED', durationMs: 5000, distanceKm: 3 }));
    expect(result.accepted).toBe(true);
  });

  test('a cancelled trip should have all its events stored', () => {
    processor.process(makeEvent({ eventId: 'e-start',  tripId: 'T1', type: 'TRIP_STARTED' }));
    const result = processor.process(makeEvent({ eventId: 'e-cancel', tripId: 'T1', type: 'TRIP_CANCELLED' }));
    expect(result.accepted).toBe(true);
  });

  test('submitting the same event twice should only store it once', () => {
    const event = makeEvent({ eventId: 'e-dup', tripId: 'T1' });
    processor.process(event);
    const result = processor.process({ ...event, tripId: 'T-other' });
    expect(result.accepted).toBe(false);
    expect(result.reason).toBe('duplicate');
  });

  test('processAll should store every event in a complete trip lifecycle', () => {
    const events: TripEvent[] = [
      makeEvent({ eventId: 'e1', tripId: 'T1', type: 'TRIP_STARTED',   timestamp: 1000 }),
      makeEvent({ eventId: 'e2', tripId: 'T1', type: 'TRIP_COMPLETED', timestamp: 2000, durationMs: 1000, distanceKm: 5 }),
    ];
    const results = processor.processAll(events);
    expect(results[0].accepted).toBe(true);
    expect(results[1].accepted).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// [BUG] Stats: completion — something is wrong with completed trip counting
// Tests seed the store directly so they are independent of the dedup bug above
// ─────────────────────────────────────────────────────────────────────────────

describe('[BUG] Stats — completion', () => {
  beforeEach(() => {
    store.save({ eventId: 'e1', tripId: 'T1', driverId: 'D1', type: 'TRIP_STARTED',   timestamp: 1000 });
    store.save({ eventId: 'e2', tripId: 'T1', driverId: 'D1', type: 'TRIP_COMPLETED', timestamp: 2000, durationMs: 60_000, distanceKm: 5 });
    store.save({ eventId: 'e3', tripId: 'T2', driverId: 'D1', type: 'TRIP_STARTED',   timestamp: 3000 });
    store.save({ eventId: 'e4', tripId: 'T2', driverId: 'D1', type: 'TRIP_CANCELLED', timestamp: 4000 });
  });

  test('completedTrips should reflect the number of completed events', () => {
    const stats = processor.getStats('D1');
    expect(stats.completedTrips).toBe(1);
  });

  test('completionRate should be the ratio of completed to started trips', () => {
    const stats = processor.getStats('D1');
    expect(stats.completionRate).toBe(0.5);
  });

  test('totalDistanceKm should be the sum across completed trips', () => {
    const stats = processor.getStats('D1');
    expect(stats.totalDistanceKm).toBe(5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// [BUG] Stats: duration — avgDurationMs is computed incorrectly
// ─────────────────────────────────────────────────────────────────────────────

describe('[BUG] Stats — average duration', () => {
  test('avgDurationMs should not be diluted by non-completed events', () => {
    store.save({ eventId: 'e1', tripId: 'T1', driverId: 'D2', type: 'TRIP_STARTED',   timestamp: 1000 });
    store.save({ eventId: 'e2', tripId: 'T1', driverId: 'D2', type: 'TRIP_COMPLETED', timestamp: 2000, durationMs: 60_000, distanceKm: 3 });
    store.save({ eventId: 'e3', tripId: 'T2', driverId: 'D2', type: 'TRIP_STARTED',   timestamp: 3000 });
    store.save({ eventId: 'e4', tripId: 'T2', driverId: 'D2', type: 'TRIP_CANCELLED', timestamp: 4000 });

    const stats = processor.getStats('D2');
    expect(stats.avgDurationMs).toBe(60_000);
  });

  test('avgDurationMs should be 0 when the driver has no completed trips', () => {
    store.save({ eventId: 'e1', tripId: 'T1', driverId: 'D3', type: 'TRIP_STARTED', timestamp: 1000 });
    const stats = processor.getStats('D3');
    expect(stats.avgDurationMs).toBe(0);
  });
});
