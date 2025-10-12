import { PlayerAiBlackboard } from "../player-ai-blackboard";
import { getActorComponent } from "../../../data/actor-component";
import { HealthComponent } from "../../../entity/components/combat/components/health-component";
import { AttackComponent } from "../../../entity/components/combat/components/attack-component";
import { DistanceHelper } from "../../../library/distance-helper";
import { OrderData } from "../../../ai/OrderData";
import { OrderType } from "../../../ai/order-type";
import { PawnAiController } from "../../../prefabs/ai-agents/pawn-ai-controller";
import type { Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import GameObject = Phaser.GameObjects.GameObject;

/**
 * CombatMicroManager
 * - Provides micro-level heuristics for combat engagement, focus fire, retreat, flanking.
 * - Designed to keep logic out of the agent wrapper while remaining stateless (except minimal cooldowns).
 */
export class CombatMicroManager {
  private lastFocusFireAt = 0;
  private lastRetreatCheckAt = 0;
  private lastFlankAt = 0;
  private readonly focusFireCooldownMs = 1500;
  private readonly retreatCooldownMs = 1200;
  private readonly flankCooldownMs = 4000;
  private readonly lowHealthRatio = 0.3;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly blackboard: PlayerAiBlackboard,
    private readonly log: (...args: any[]) => void
  ) {}

  isInCombat(): boolean {
    // Basic heuristic: any enemies flagged in combat OR any friendly unit near an enemy within 8 tiles
    if (this.blackboard.enemiesInCombat.length > 0) return true;
    const enemies = this.blackboard.visibleEnemies;
    if (enemies.length === 0) return false;
    for (const u of this.blackboard.units) {
      for (const e of enemies) {
        const d = DistanceHelper.getTileDistanceBetweenGameObjects(u, e as GameObject);
        if (d !== null && d <= 8) return true;
      }
    }
    return false;
  }

  hasLowHealthUnit(): boolean {
    return this.getLowHealthUnits().length > 0;
  }

  enemyInRange(): boolean {
    const enemies = this.blackboard.visibleEnemies;
    if (enemies.length === 0) return false;
    for (const u of this.blackboard.units) {
      const attack = getActorComponent(u, AttackComponent);
      if (!attack) continue;
      for (const e of enemies) {
        const d = DistanceHelper.getTileDistanceBetweenGameObjects(u, e as GameObject);
        if (d !== null && d <= 8 /* coarse fallback range */) return true;
      }
    }
    return false;
  }

  focusFire(): boolean {
    const now = performance.now();
    if (now - this.lastFocusFireAt < this.focusFireCooldownMs) return false;
    const enemies = this.blackboard.visibleEnemies;
    if (enemies.length === 0) return false;
    // Choose lowest health enemy (if health component available) else first
    let target: GameObject | null = null;
    let lowestRatio = Infinity;
    enemies.forEach((e: any) => {
      const hc = getActorComponent(e, HealthComponent);
      if (!hc) return;
      const ratio = hc.healthComponentData.health / (hc.healthDefinition.maxHealth || 1);
      if (ratio < lowestRatio) {
        lowestRatio = ratio;
        target = e;
      }
    });
    if (!target && enemies.length) {
      target = enemies[0] ?? null;
    }
    if (!target) return false;
    this.blackboard.units.forEach((u) => {
      const pawnAi = getActorComponent(u, PawnAiController);
      if (!pawnAi) return;
      const order = new OrderData(OrderType.Attack, { targetGameObject: target! });
      pawnAi.blackboard.overrideOrderQueueAndActiveOrder(order);
      pawnAi.blackboard.setCurrentOrder(order);
    });
    this.lastFocusFireAt = now;
    this.log("Focus fire issued.");
    return true;
  }

  flankEnemy(): boolean {
    const now = performance.now();
    if (now - this.lastFlankAt < this.flankCooldownMs) return false;
    if (!this.blackboard.enemyFlankOpen) return false;
    const enemies = this.blackboard.visibleEnemies;
    if (enemies.length === 0) return false;
    const primary = enemies[0];
    if (!primary) return false;
    const primaryBody: any = primary.body || primary;
    if (!primaryBody || primaryBody.x == null) return false;
    const offset = 6;
    let side = 1;
    this.blackboard.units.forEach((u, i) => {
      const pawnAi = getActorComponent(u, PawnAiController);
      if (!pawnAi) return;
      const targetPoint = {
        x: primaryBody.x + offset * side,
        y: primaryBody.y + (i % 3) - 1,
        z: 0
      } satisfies Vector3Simple;
      const order = new OrderData(OrderType.Move, { targetTileLocation: targetPoint });
      pawnAi.blackboard.overrideOrderQueueAndActiveOrder(order);
      pawnAi.blackboard.setCurrentOrder(order);
      side = side * -1;
    });
    this.lastFlankAt = now;
    this.log("Flank maneuver initiated.");
    return true;
  }

  retreatLowHealthUnits(): boolean {
    const now = performance.now();
    if (now - this.lastRetreatCheckAt < this.retreatCooldownMs) return false;
    const lows = this.getLowHealthUnits();
    if (lows.length === 0) return false;
    const fallback = this.blackboard.baseCenterTile || ({ x: 0, y: 0, z: 0 } satisfies Vector3Simple);
    lows.forEach((u) => {
      const pawnAi = getActorComponent(u, PawnAiController);
      if (!pawnAi) return;
      const order = new OrderData(OrderType.Move, { targetTileLocation: fallback });
      pawnAi.blackboard.overrideOrderQueueAndActiveOrder(order);
      pawnAi.blackboard.setCurrentOrder(order);
    });
    this.lastRetreatCheckAt = now;
    this.log("Retreat order issued to low-health units.");
    return true;
  }

  private getLowHealthUnits(): GameObject[] {
    const out: GameObject[] = [];
    this.blackboard.units.forEach((u) => {
      const hc = getActorComponent(u, HealthComponent);
      if (!hc) return;
      const ratio = hc.healthComponentData.health / (hc.healthDefinition.maxHealth || 1);
      if (ratio <= this.lowHealthRatio) out.push(u);
    });
    return out;
  }
}
