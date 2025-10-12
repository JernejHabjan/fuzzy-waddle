// Centralize gating of expensive / high-level AI actions.
// Existing direct timestamp comparisons can be refactored progressively to use this manager.

export interface CooldownEntry {
  nextReadyAt: number;
  intervalMs: number;
  jitterMs?: number;
}

export class CooldownManager {
  private entries = new Map<string, CooldownEntry>();

  /** Configure or reconfigure a cooldown entry. */
  configure(id: string, intervalMs: number, jitterMs?: number): void {
    const existing = this.entries.get(id);
    if (existing) {
      existing.intervalMs = intervalMs;
      existing.jitterMs = jitterMs;
      // Preserve nextReadyAt unless earlier than now
      return;
    }
    this.entries.set(id, { nextReadyAt: 0, intervalMs, jitterMs });
  }

  /** Return true if cooldown ready (or unconfigured). */
  canRun(id: string, now: number): boolean {
    const e = this.entries.get(id);
    if (!e) return true; // not configured yet
    return now >= e.nextReadyAt;
  }

  /** Mark a run at current time (uses stored interval). */
  markRun(id: string, now: number): void {
    const e = this.entries.get(id);
    if (!e) return; // silently ignore if unconfigured
    const jitter = e.jitterMs ? Math.random() * e.jitterMs : 0;
    e.nextReadyAt = now + e.intervalMs + jitter;
  }

  /** Get next ready timestamp (or now if unconfigured). */
  nextTime(id: string, now: number): number {
    const e = this.entries.get(id);
    return e ? e.nextReadyAt : now;
  }
}
