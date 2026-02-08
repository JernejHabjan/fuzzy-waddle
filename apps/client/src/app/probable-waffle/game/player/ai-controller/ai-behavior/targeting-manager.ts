import { PlayerAiBlackboard } from "../player-ai-blackboard";
import { getActorComponent } from "../../../data/actor-component";
import { HealthComponent } from "../../../entity/components/combat/components/health-component";
import { DistanceHelper } from "../../../library/distance-helper";
import { OwnerComponent } from "../../../entity/components/owner-component";
import { AttackComponent } from "../../../entity/components/combat/components/attack-component";
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

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly blackboard: PlayerAiBlackboard
  ) {}

  async update(now: number = performance.now()): Promise<void> {
    if (now - this.lastEvalAt < this.evalCooldownMs && this.cachedTarget) return;
    this.lastEvalAt = now;
    const enemies = this.blackboard.visibleEnemies as GameObject[];
    if (!enemies || enemies.length === 0) {
      this.cachedTarget = null;
      this.blackboard.primaryTarget = null;
      return;
    }

    this.cachedTarget = await this.findTarget(enemies);
    this.blackboard.primaryTarget = this.cachedTarget;
  }

  private findWeakestPlayer(): number | undefined {
    // find the weakest player
    const enemyIntel = this.blackboard.enemyIntel;
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
    return weakestPlayer;
  }

  private async findTarget(enemies: GameObject[]): Promise<GameObject | null> {
    const center = this.blackboard.baseCenterTile;
    const strategy = this.blackboard.currentStrategy;
    const weakestPlayer = this.findWeakestPlayer();

    // Batch calculate all distances upfront if we have a center
    let distances: (number | null)[] = [];
    if (center) {
      distances = await DistanceHelper.batchGetTileDistancesToTile(enemies, center);
    }

    let best: { score: number; obj: GameObject } | undefined;
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i]!;
      if (!e.active) continue;
      let score = 0;
      const hc = getActorComponent(e, HealthComponent);
      if (hc) {
        const ratio = hc.healthComponentData.health / (hc.healthDefinition.maxHealth || 1);
        score += (1 - ratio) * 50; // prefer lower health
      }

      if (center) {
        const distance = distances[i];
        if (typeof distance !== 'number') {
          continue; // ignore this target if distance cannot be calculated
        }
        score += 30 / distance; // nearer to our base center slightly higher priority
      }

      if (!this.scene.scene.isActive()) {
        // after long async action, scene might be destroyed
        return null;
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
    }
    return best?.obj || null;
  }
}
