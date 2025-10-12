import { PlayerAiBlackboard } from "../player-ai-blackboard";
import { OrderData } from "../../../ai/OrderData";
import { OrderType } from "../../../ai/order-type";
import { getActorComponent } from "../../../data/actor-component";
import { PawnAiController } from "../../../prefabs/ai-agents/pawn-ai-controller";
import type { Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import GameObject = Phaser.GameObjects.GameObject;

/**
 * ScoutingManager
 * - Assigns idle units (or dedicated scouts if detectable) to uncover map fog.
 * - Maintains a simple sector visitation timestamp grid (coarse) to prioritize unexplored areas.
 */
export class ScoutingManager {
  private sectorSize = 32; // tiles per sector (coarse)
  private visitedSectors = new Map<string, number>();
  private lastAssignAt = 0;
  private readonly assignCooldownMs = 4000;
  private lastNeedEval = 0;
  private cachedNeed = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly blackboard: PlayerAiBlackboard,
    private readonly log: (...args: any[]) => void
  ) {}

  /** Evaluate if more scouting is needed (unvisited sectors threshold). */
  needToScout(now: number = performance.now()): boolean {
    if (now - this.lastNeedEval < 1500) return this.cachedNeed;
    this.lastNeedEval = now;
    // Count sectors visited in last 20s
    const horizon = now - 20000;
    let fresh = 0;
    for (const t of this.visitedSectors.values()) if (t >= horizon) fresh++;
    // Heuristic: if fewer than 6 fresh sectors, we want scouting
    this.cachedNeed = fresh < 6;
    return this.cachedNeed;
  }

  /** Mark sectors around visible friendly units as visited. Call periodically. */
  updateVisionSampling(now: number = performance.now()) {
    this.blackboard.units.forEach((u) => {
      const body: any = u.body || u;
      if (!body || body.x == null) return;
      const sx = Math.floor(body.x / this.sectorSize);
      const sy = Math.floor(body.y / this.sectorSize);
      this.visitedSectors.set(`${sx},${sy}`, now);
    });
  }

  assignScoutUnits(now: number = performance.now()): boolean {
    if (now - this.lastAssignAt < this.assignCooldownMs) return false;
    const idleCandidates: GameObject[] = [];
    this.blackboard.units.forEach((u) => {
      const pawn = getActorComponent(u, PawnAiController);
      if (!pawn) return;
      if (!pawn.blackboard.getCurrentOrder()) idleCandidates.push(u);
    });
    if (idleCandidates.length === 0) return false;
    // Pick 2 random idle units
    const chosen = idleCandidates.slice(0, 2);
    let issued = 0;
    chosen.forEach((u, i) => {
      const pawn = getActorComponent(u, PawnAiController);
      if (!pawn) return;
      const targetPoint =
        this.findUnvisitedSectorPoint() || ({ x: (i + 1) * 10, y: (i + 1) * 5, z: 0 } satisfies Vector3Simple);
      const order = new OrderData(OrderType.Move, { targetTileLocation: targetPoint });
      pawn.blackboard.overrideOrderQueueAndActiveOrder(order);
      pawn.blackboard.setCurrentOrder(order);
      issued++;
    });
    if (issued > 0) {
      this.lastAssignAt = now;
      this.log("Assigned scout units", issued);
      return true;
    }
    return false;
  }

  private findUnvisitedSectorPoint(): { x: number; y: number; z: number } | null {
    // sample outward spiral for a sector not in visited map
    for (let radius = 1; radius < 15; radius++) {
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue; // ring only
          const key = `${dx},${dy}`;
          if (!this.visitedSectors.has(key)) {
            return {
              x: dx * this.sectorSize + this.sectorSize / 2,
              y: dy * this.sectorSize + this.sectorSize / 2,
              z: 0
            };
          }
        }
      }
    }
    return null;
  }
}
