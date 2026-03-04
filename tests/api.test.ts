import { describe, test, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/api';
import { EventStore } from '../src/db';
import { TripEvent } from '../src/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeEvent(overrides: Partial<TripEvent> = {}): TripEvent {
  return {
    eventId: `evt-${Math.random().toString(36).slice(2, 8)}`,
    tripId:  `trip-${Math.random().toString(36).slice(2, 8)}`,
    driverId: 'driver-001',
    type: 'TRIP_STARTED',
    timestamp: Date.now(),
    ...overrides,
  };
}

let store: EventStore;
let app: ReturnType<typeof createApp>;

beforeEach(() => {
  store = new EventStore();
  app = createApp(store);
});

// ─────────────────────────────────────────────────────────────────────────────
// [REG] POST /events — already working, must stay working
// ─────────────────────────────────────────────────────────────────────────────

describe('[REG] POST /events', () => {
  test('should accept a valid event and return 201', async () => {
    const event = makeEvent();
    const res = await request(app).post('/events').send(event);
    expect(res.status).toBe(201);
    expect(res.body.accepted).toBe(true);
    expect(res.body.eventId).toBe(event.eventId);
  });

  test('should return 409 for an invalid event', async () => {
    const res = await request(app).post('/events').send({ eventId: '', tripId: 't1', driverId: 'd1', type: 'TRIP_STARTED', timestamp: 1 });
    expect(res.status).toBe(409);
    expect(res.body.accepted).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// [FEAT] GET /events — implement this endpoint in api.ts
// ─────────────────────────────────────────────────────────────────────────────

describe('[FEAT] GET /events', () => {
  test('should return all events sorted by timestamp ascending', async () => {
    const e1 = makeEvent({ eventId: 'e1', timestamp: 2000 });
    const e2 = makeEvent({ eventId: 'e2', timestamp: 1000 });
    store.save(e1);
    store.save(e2);

    const res = await request(app).get('/events');
    expect(res.status).toBe(200);
    expect(res.body.events).toHaveLength(2);
    expect(res.body.events[0].eventId).toBe('e2'); // earlier timestamp first
    expect(res.body.events[1].eventId).toBe('e1');
  });

  test('should return empty array when no events exist', async () => {
    const res = await request(app).get('/events');
    expect(res.status).toBe(200);
    expect(res.body.events).toEqual([]);
  });

  test('should filter by driverId when ?driverId= is provided', async () => {
    store.save(makeEvent({ eventId: 'e1', driverId: 'driver-A', timestamp: 1000 }));
    store.save(makeEvent({ eventId: 'e2', driverId: 'driver-B', timestamp: 2000 }));
    store.save(makeEvent({ eventId: 'e3', driverId: 'driver-A', timestamp: 3000 }));

    const res = await request(app).get('/events?driverId=driver-A');
    expect(res.status).toBe(200);
    expect(res.body.events).toHaveLength(2);
    expect(res.body.events.every((e: TripEvent) => e.driverId === 'driver-A')).toBe(true);
  });

  test('should return empty array for unknown driverId filter', async () => {
    store.save(makeEvent({ eventId: 'e1', driverId: 'driver-A', timestamp: 1000 }));
    const res = await request(app).get('/events?driverId=nobody');
    expect(res.status).toBe(200);
    expect(res.body.events).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// [FEAT] POST /events/bulk — implement this endpoint in api.ts
// ─────────────────────────────────────────────────────────────────────────────

describe('[FEAT] POST /events/bulk', () => {
  test('should process an array of events and return one result per event', async () => {
    const events = [
      makeEvent({ eventId: 'b1', tripId: 'T1', type: 'TRIP_STARTED' }),
      makeEvent({ eventId: 'b2', tripId: 'T2', type: 'TRIP_STARTED' }),
    ];
    const res = await request(app).post('/events/bulk').send(events);
    expect(res.status).toBe(200);
    expect(res.body.results).toHaveLength(2);
    expect(res.body.results[0].accepted).toBe(true);
    expect(res.body.results[1].accepted).toBe(true);
  });

  test('should return 200 even when some events are rejected', async () => {
    const events = [
      makeEvent({ eventId: 'b1', tripId: 'T1' }),
      makeEvent({ eventId: '',   tripId: 'T2' }), // invalid — missing eventId
    ];
    const res = await request(app).post('/events/bulk').send(events);
    expect(res.status).toBe(200);
    expect(res.body.results[0].accepted).toBe(true);
    expect(res.body.results[1].accepted).toBe(false);
  });

  test('should return an empty results array for an empty input array', async () => {
    const res = await request(app).post('/events/bulk').send([]);
    expect(res.status).toBe(200);
    expect(res.body.results).toEqual([]);
  });

  test('should preserve order — result[i] corresponds to event[i]', async () => {
    const events = [
      makeEvent({ eventId: 'b1', tripId: 'T1' }),
      makeEvent({ eventId: 'b2', tripId: 'T2' }),
      makeEvent({ eventId: 'b3', tripId: 'T3' }),
    ];
    const res = await request(app).post('/events/bulk').send(events);
    expect(res.status).toBe(200);
    expect(res.body.results[0].eventId).toBe('b1');
    expect(res.body.results[1].eventId).toBe('b2');
    expect(res.body.results[2].eventId).toBe('b3');
  });
});
