// Resource Reservation System
// Central pool preventing double-spend of resources across planned builds or future unit training.
import { ResourceType } from "@fuzzy-waddle/api-interfaces";

export interface ResourceReservation {
  id: string;
  minerals?: number;
  wood?: number;
  stone?: number;
  housing?: number;
  ambrosia?: number;
  expiresAt: number;
  createdAt: number;
  meta?: Record<string, unknown>;
}

export class ReservationPool {
  private reservations = new Map<string, ResourceReservation>();

  reserve(
    token: string,
    costs: Partial<Record<ResourceType, number>>,
    ttlMs: number,
    now: number
  ): ResourceReservation {
    const existing = this.reservations.get(token);
    const res = {
      id: token,
      minerals: costs.minerals || 0,
      wood: costs.wood || 0,
      stone: costs.stone || 0,
      ambrosia: costs.ambrosia || 0,
      createdAt: now,
      expiresAt: now + ttlMs
    } satisfies ResourceReservation;
    if (existing) {
      // Overwrite existing (breaking change acceptable per instructions)
      this.reservations.set(token, res);
      return res;
    }
    this.reservations.set(token, res);
    return res;
  }

  release(token: string): boolean {
    return this.reservations.delete(token);
  }

  prune(now: number): void {
    for (const [id, r] of this.reservations) {
      if (now >= r.expiresAt) this.reservations.delete(id);
    }
  }

  getTotals(): Record<ResourceType, number> {
    const total = {
      [ResourceType.Ambrosia]: 0,
      [ResourceType.Minerals]: 0,
      [ResourceType.Wood]: 0,
      [ResourceType.Stone]: 0
    } satisfies Record<ResourceType, number>;
    for (const r of this.reservations.values()) {
      total[ResourceType.Minerals] += r.minerals || 0;
      total[ResourceType.Wood] += r.wood || 0;
      total[ResourceType.Stone] += r.stone || 0;
      total[ResourceType.Ambrosia] += r.ambrosia || 0;
    }
    return total;
  }

  has(token: string): boolean {
    return this.reservations.has(token);
  }

  list(): ResourceReservation[] {
    return Array.from(this.reservations.values());
  }
}
