import express, { Request, Response } from 'express';
import { TripProcessor } from './processor';
import { EventStore } from './db';
import { TripEvent } from './types';

export function createApp(store: EventStore) {
  const app = express();
  const processor = new TripProcessor(store);

  app.use(express.json());

  // ─── WORKING: do not modify ────────────────────────────────────────────────

  /**
   * POST /events
   * Submit a single trip event.
   * Returns 201 if accepted, 409 if rejected (duplicate or invalid).
   */
  app.post('/events', (req: Request, res: Response) => {
    const event = req.body as TripEvent;
    const result = processor.process(event);
    if (!result.accepted) {
      return res.status(409).json(result);
    }
    res.status(201).json(result);
  });

  /**
   * GET /stats/:driverId
   * Get aggregated stats for a specific driver.
   */
  app.get('/stats/:driverId', (req: Request, res: Response) => {
    const { driverId } = req.params;
    const stats = processor.getStats(driverId);
    res.json(stats);
  });

  // ─── MISSING: implement these two endpoints ─────────────────────────────────

  /**
   * GET /events
   * Return all stored events, sorted by timestamp ascending.
   * Supports optional query param: ?driverId=<id> to filter by driver.
   *
   * Response: 200 { events: TripEvent[] }
   *
   * TODO: implement this
   */
  app.get('/events', (_req: Request, res: Response) => {
    res.status(501).json({ error: 'Not implemented' });
  });

  /**
   * POST /events/bulk
   * Accept an array of events. Process each in order. Return an array of
   * ProcessResult — one per input event, in the same order.
   *
   * Response: 200 { results: ProcessResult[] }
   * Always returns 200 even if some events are rejected — the per-item
   * result carries the accepted/rejected signal.
   *
   * TODO: implement this
   */
  app.post('/events/bulk', (_req: Request, res: Response) => {
    res.status(501).json({ error: 'Not implemented' });
  });

  return app;
}
