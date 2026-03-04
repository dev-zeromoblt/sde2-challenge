export type EventType = 'TRIP_STARTED' | 'TRIP_COMPLETED' | 'TRIP_CANCELLED';

export interface TripEvent {
  eventId: string;      // unique per event (UUID) — used for deduplication
  tripId: string;       // identifies the trip across its lifecycle
  driverId: string;     // driver responsible for this trip
  type: EventType;
  timestamp: number;    // unix epoch milliseconds
  durationMs?: number;  // only present on TRIP_COMPLETED
  distanceKm?: number;  // only present on TRIP_COMPLETED
}

export interface DriverStats {
  driverId: string;
  totalTrips: number;          // unique tripIds that were started
  completedTrips: number;
  cancelledTrips: number;
  completionRate: number;      // completedTrips / totalTrips, rounded to 2 decimal places
  totalDistanceKm: number;     // sum across completed trips
  avgDurationMs: number;       // average across completed trips that have durationMs
}

export interface ProcessResult {
  accepted: boolean;
  eventId: string;
  reason?: 'duplicate' | 'invalid';
}
