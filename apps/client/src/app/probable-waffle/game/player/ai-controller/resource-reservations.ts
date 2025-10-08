// Resource Reservation System
// Central pool preventing double-spend of resources across planned builds or future unit training.
import { ResourceType } from "@fuzzy-waddle/api-interfaces";

export interface ResourceReservation {
  id: string;
  minerals?: number;
  wood?: number;
  stone?: number;
  food?: number;
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
    const res: ResourceReservation = {
      id: token,
      minerals: costs.minerals || 0,
      wood: costs.wood || 0,
      stone: costs.stone || 0,
      food: costs.food || 0,
      ambrosia: costs.ambrosia || 0,
      createdAt: now,
      expiresAt: now + ttlMs
    };
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
    const total: Record<ResourceType, number> = { ambrosia: 0, food: 0, minerals: 0, stone: 0, wood: 0 };
    for (const r of this.reservations.values()) {
      total.minerals += r.minerals || 0;
      total.wood += r.wood || 0;
      total.stone += r.stone || 0;
      total.food += r.food || 0;
      total.ambrosia += r.ambrosia || 0;
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
