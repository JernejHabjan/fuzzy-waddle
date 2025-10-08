import { PlayerAiBlackboard } from "../player-ai-blackboard";
import { getActorComponent } from "../../../data/actor-component";
import { HealthComponent } from "../../../entity/components/combat/components/health-component";
import { DistanceHelper } from "../../../library/distance-helper";
import GameObject = Phaser.GameObjects.GameObject;

/**
 * TargetingManager
 * - Scores visible enemies and selects a primary target for coordinated actions.
 * - Caches last evaluation for a short interval to reduce recomputation.
 */
export class TargetingManager {
  private lastEvalAt = 0;
  private readonly evalCooldownMs = 750;
  private cachedTarget: GameObject | null = null;

  constructor(private readonly blackboard: PlayerAiBlackboard) {}

  update(now: number = performance.now()): GameObject | null {
    if (now - this.lastEvalAt < this.evalCooldownMs && this.cachedTarget) return this.cachedTarget;
    this.lastEvalAt = now;
    const enemies = this.blackboard.visibleEnemies as GameObject[];
    if (!enemies || enemies.length === 0) {
      this.cachedTarget = null;
      return null;
    }
    const center = this.blackboard.baseCenterTile;
    let best: { score: number; obj: GameObject } | undefined;
    enemies.forEach((e) => {
      let score = 0;
      const hc = getActorComponent(e, HealthComponent);
      if (hc) {
        const ratio = hc.healthComponentData.health / (hc.healthDefinition.maxHealth || 1);
        score += (1 - ratio) * 50; // prefer lower health
      }
      if (center) {
        const d = DistanceHelper.getTileDistanceBetweenGameObjectAndTile(e, center) || 20;
        score += 30 / d; // nearer to our base center slightly higher priority
      }
      // Add simple threat proxy: stored enemyMilitaryStrength not per-unit yet, so approximate with 10
      score += 10;
      if (!best || score > best.score) {
        best = { score, obj: e };
      }
    });
    this.cachedTarget = best?.obj || null;
    this.blackboard.primaryTarget = this.cachedTarget;
    return this.cachedTarget;
  }
}
