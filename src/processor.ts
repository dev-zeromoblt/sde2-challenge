import { TripEvent, DriverStats, ProcessResult } from './types';
import { EventStore } from './db';

export class TripProcessor {
  // Tracks IDs we have already seen to prevent duplicate processing
  private seenIds: Set<string> = new Set();

  constructor(private store: EventStore) {}

  /**
   * Process a single trip event.
   * Returns accepted:true if the event was stored, accepted:false otherwise.
   */
  process(event: TripEvent): ProcessResult {
    // Validate required fields
    if (!event.eventId || !event.tripId || !event.driverId || !event.type) {
      return { accepted: false, eventId: event.eventId ?? '', reason: 'invalid' };
    }

    // BUG 1: Deduplication should be based on eventId (each event is unique).
    // Using tripId here incorrectly rejects TRIP_COMPLETED / TRIP_CANCELLED
    // events because their tripId was already seen from TRIP_STARTED.
    if (this.seenIds.has(event.tripId)) {
      return { accepted: false, eventId: event.eventId, reason: 'duplicate' };
    }
    this.seenIds.add(event.tripId); // should be: this.seenIds.add(event.eventId)

    this.store.save(event);
    return { accepted: true, eventId: event.eventId };
  }

  /**
   * Compute aggregated statistics for a driver across all their stored events.
   */
  getStats(driverId: string): DriverStats {
    const all = this.store.findByDriverId(driverId);

    // BUG 2: Wrong event type string — 'TRIP_COMPLETE' instead of 'TRIP_COMPLETED'
    // This means completedTrips is always 0, which cascades into completionRate
    // and totalDistanceKm also being wrong.
    const completed = all.filter(e => e.type === 'TRIP_COMPLETE'); // should be: 'TRIP_COMPLETED'

    const cancelled = all.filter(e => e.type === 'TRIP_CANCELLED');

    const startedTripIds = new Set(
      all.filter(e => e.type === 'TRIP_STARTED').map(e => e.tripId)
    );

    const totalDistanceKm = completed.reduce(
      (sum, e) => sum + (e.distanceKm ?? 0), 0
    );

    const withDuration = completed.filter(e => e.durationMs !== undefined);

    // BUG 3: Divides by `all.length` (total events for driver) instead of
    // `withDuration.length` (completed events that have a duration).
    // When a driver has started/cancelled trips, the average gets artificially diluted.
    const avgDurationMs =
      withDuration.length > 0
        ? withDuration.reduce((sum, e) => sum + (e.durationMs ?? 0), 0) / all.length // should be: / withDuration.length
        : 0;

    const completionRate =
      startedTripIds.size > 0
        ? Math.round((completed.length / startedTripIds.size) * 100) / 100
        : 0;

    return {
      driverId,
      totalTrips: startedTripIds.size,
      completedTrips: completed.length,
      cancelledTrips: cancelled.length,
      completionRate,
      totalDistanceKm,
      avgDurationMs: Math.round(avgDurationMs),
    };
  }

  /**
   * Process multiple events in order. Returns one result per input event.
   */
  processAll(events: TripEvent[]): ProcessResult[] {
    return events.map(e => this.process(e));
  }
}
