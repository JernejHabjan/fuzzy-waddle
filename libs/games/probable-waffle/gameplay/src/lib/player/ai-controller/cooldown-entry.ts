export interface CooldownEntry {
  nextReadyAt: number;
  intervalMs: number;
  jitterMs?: number;
}
