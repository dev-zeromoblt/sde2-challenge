import { TripEvent } from './types';

/**
 * In-memory event store. No bugs here — do not modify.
 */
export class EventStore {
  private events: Map<string, TripEvent> = new Map();

  save(event: TripEvent): void {
    this.events.set(event.eventId, event);
  }

  findByEventId(eventId: string): TripEvent | undefined {
    return this.events.get(eventId);
  }

  findByDriverId(driverId: string): TripEvent[] {
    return Array.from(this.events.values()).filter(e => e.driverId === driverId);
  }

  findByTripId(tripId: string): TripEvent[] {
    return Array.from(this.events.values()).filter(e => e.tripId === tripId);
  }

  findAll(): TripEvent[] {
    return Array.from(this.events.values()).sort((a, b) => a.timestamp - b.timestamp);
  }

  clear(): void {
    this.events.clear();
  }

  size(): number {
    return this.events.size;
  }
}

export const store = new EventStore();
