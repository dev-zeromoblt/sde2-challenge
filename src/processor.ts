import { TripEvent, DriverStats, ProcessResult } from './types';
import { EventStore } from './db';

export class TripProcessor {
  private seenIds: Set<string> = new Set();

  constructor(private store: EventStore) {}

  /**
   * Process a single trip event.
   * Returns accepted:true if the event was stored, accepted:false otherwise.
   */
  process(event: TripEvent): ProcessResult {
    if (!event.eventId || !event.tripId || !event.driverId || !event.type) {
      return { accepted: false, eventId: event.eventId ?? '', reason: 'invalid' };
    }

    if (this.seenIds.has(event.tripId)) {
      return { accepted: false, eventId: event.eventId, reason: 'duplicate' };
    }
    this.seenIds.add(event.tripId);

    this.store.save(event);
    return { accepted: true, eventId: event.eventId };
  }

  /**
   * Compute aggregated statistics for a driver across all their stored events.
   */
  getStats(driverId: string): DriverStats {
    const all = this.store.findByDriverId(driverId);

    const completed = all.filter(e => e.type === 'TRIP_COMPLETE');

    const cancelled = all.filter(e => e.type === 'TRIP_CANCELLED');

    const startedTripIds = new Set(
      all.filter(e => e.type === 'TRIP_STARTED').map(e => e.tripId)
    );

    const totalDistanceKm = completed.reduce(
      (sum, e) => sum + (e.distanceKm ?? 0), 0
    );

    const withDuration = completed.filter(e => e.durationMs !== undefined);

    const avgDurationMs =
      withDuration.length > 0
        ? withDuration.reduce((sum, e) => sum + (e.durationMs ?? 0), 0) / all.length
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
