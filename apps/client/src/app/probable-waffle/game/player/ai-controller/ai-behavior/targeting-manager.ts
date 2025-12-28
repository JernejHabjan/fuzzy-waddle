import { PlayerAiBlackboard } from "../player-ai-blackboard";
import { getActorComponent } from "../../../data/actor-component";
import { HealthComponent } from "../../../entity/components/combat/components/health-component";
import { DistanceHelper } from "../../../library/distance-helper";
import GameObject = Phaser.GameObjects.GameObject;
import { OwnerComponent } from "../../../entity/components/owner-component";
import { AttackComponent } from "../../../entity/components/combat/components/attack-component";

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
      this.blackboard.primaryTarget = null;
      return null;
    }
    const center = this.blackboard.baseCenterTile;
    const strategy = this.blackboard.currentStrategy;
    const enemyIntel = this.blackboard.enemyIntel;

    // find weakest player
    let weakestPlayer: number | undefined;
    let minStrength = Infinity;
    if (enemyIntel) {
      for (const player in enemyIntel) {
        if (enemyIntel[player]!.strength < minStrength) {
          minStrength = enemyIntel[player]!.strength;
          weakestPlayer = parseInt(player);
        }
      }
    }

    let best: { score: number; obj: GameObject } | undefined;
    enemies.forEach((e) => {
      if (!e.active) return;
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

      const owner = getActorComponent(e, OwnerComponent)?.getOwner();
      if (owner === weakestPlayer) {
        score += 20; // bonus for targeting weakest player
      }

      if (strategy === "aggressive") {
        // prefer high value targets. For now, let's just add to score of combat units
        if (getActorComponent(e, AttackComponent)) {
          score += 10;
        }
      }

      if (!best || score > best.score) {
        best = { score, obj: e };
      }
    });
    this.cachedTarget = best?.obj || null;
    this.blackboard.primaryTarget = this.cachedTarget;
    return this.cachedTarget;
  }
}
