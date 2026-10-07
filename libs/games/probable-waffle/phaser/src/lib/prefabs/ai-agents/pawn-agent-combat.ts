import Phaser from "phaser";
import { State } from "mistreevous";
import type { PlayerPawnAiControllerAgent } from "./player-pawn-ai-controller.agent";
import { getActorComponent } from "../../data/actor-component";
import { VisionComponent } from "../../entity/components/vision-component";
import { DistanceHelper } from "../../library/distance-helper";
import { AttackComponent } from "../../entity/components/combat/components/attack-component";
import { OrderType } from "../../ai/order-type";
import { PawnAiBlackboard } from "./pawn-ai-blackboard";
import { HealthComponent } from "../../entity/components/combat/components/health-component";
import { OrderData } from "../../ai/OrderData";
import { HealingComponent } from "../../entity/components/combat/components/healing-component";
import { getSceneService } from "../../world/services/scene-component-helpers";
import { SimulationTickService } from "../../world/services/simulation-tick.service";
import { getSimulationNow } from "../../world/services/simulation-time";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";

/** Owns combat/healing actions and deterministic visible-enemy selection against the live actor components.
 * Actor-local collaborators own no subscriptions, timers or saved state; the controller owns their lifetime.
 */
export class PawnAgentCombat {
  constructor(
    private readonly gameObject: Phaser.GameObjects.GameObject,
    private readonly blackboard: PawnAiBlackboard,
    private readonly agent: Pick<PlayerPawnAiControllerAgent, "SelfIsAlive">
  ) {}

  HasAttackComponent() {
    // noinspection UnnecessaryLocalVariableJS
    const hasComponent = !!getActorComponent(this.gameObject, AttackComponent);
    return hasComponent;
  }

  Attack() {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return State.FAILED;
    if (!this.agent.SelfIsAlive()) return State.FAILED;
    const target = currentOrder.data.targetGameObject;
    if (!target) return State.FAILED;
    const targetHealth = getActorComponent(target, HealthComponent);
    if (targetHealth && !targetHealth.alive) return State.FAILED;
    const attackComponent = getActorComponent(this.gameObject, AttackComponent);
    if (!attackComponent) return State.FAILED;
    if (!attackComponent.getAttack(target)) return State.FAILED;
    if (attackComponent.remainingCooldown > 0) return State.FAILED;
    attackComponent.useAttack(target);
    return State.SUCCEEDED;
  }

  AnyEnemyVisible() {
    const visionComponent = getActorComponent(this.gameObject, VisionComponent);
    if (!visionComponent) return false;
    return visionComponent.getVisibleEnemies().length > 0;
  }

  AnyAttackableEnemyVisible() {
    return !!this.getClosestAttackableVisibleEnemy();
  }

  // Assign closest visible enemy to the CURRENT order (used for attack-move).
  AssignAttackableEnemyToCurrentOrder(): State {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return State.FAILED;
    const enemy = this.getClosestAttackableVisibleEnemy();
    if (!enemy) return State.FAILED;
    currentOrder.data.targetGameObject = enemy;
    return State.SUCCEEDED;
  }

  CanAttackCurrentTarget() {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return false;
    const target = currentOrder.data.targetGameObject;
    if (!target) return false;
    return this.canAttackTarget(target);
  }

  Attacked() {
    const attackedCooldown = 1000; // milliseconds
    const attackedCooldownTicks = Math.ceil(attackedCooldown / SimulationTickService.TICK_INTERVAL_MS);
    const healthComponent = getActorComponent(this.gameObject, HealthComponent);
    if (!healthComponent) return false;

    const latestDamage = healthComponent.latestDamage;
    if (!latestDamage) return false;

    const simulationTickService = getSceneService(this.gameObject.scene, SimulationTickService);
    if (simulationTickService && latestDamage.simulationTick !== undefined) {
      const ticksSinceDamage = simulationTickService.currentTick - latestDamage.simulationTick;
      return ticksSinceDamage < attackedCooldownTicks;
    }

    // Use scene time for proper timeScale support
    const currentSceneTime = getSimulationNow(this.gameObject.scene);
    const damageSceneTime = latestDamage.sceneTime;
    const sceneTimeSinceDamage = currentSceneTime - damageSceneTime;

    // noinspection UnnecessaryLocalVariableJS
    const attacked = sceneTimeSinceDamage < attackedCooldown;
    return attacked;
  }

  Heal(): State {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return State.FAILED;
    if (!this.agent.SelfIsAlive()) return State.FAILED;
    const target = currentOrder.data.targetGameObject;
    if (!target) return State.FAILED;
    const targetHealth = getActorComponent(target, HealthComponent);
    if (!targetHealth || !targetHealth.alive) return State.FAILED;
    if (targetHealth.healthIsFull) return State.FAILED;
    const healingComponent = getActorComponent(this.gameObject, HealingComponent);
    if (!healingComponent) return State.FAILED;
    if (healingComponent.remainingCooldown > 0) return State.FAILED;
    healingComponent.heal(target);
    return State.SUCCEEDED;
  }

  CanHeal(): boolean {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return false;
    const target = currentOrder.data.targetGameObject;
    if (!target) return false;
    const healthComponent = getActorComponent(target, HealthComponent);
    if (!healthComponent) return false;
    return !healthComponent.healthIsFull;
  }
  HasHealerComponent(): boolean {
    return !!getActorComponent(this.gameObject, HealingComponent);
  }

  AssignEnemy(source: string): State {
    switch (source) {
      case "vision":
        const visibleEnemy = this.getClosestAttackableVisibleEnemy();
        if (!visibleEnemy) return State.FAILED;
        this.blackboard.addOrder(new OrderData(OrderType.Attack, { targetGameObject: visibleEnemy }));
        return State.SUCCEEDED;
      case "retaliation": // todo
        const healthComponent = getActorComponent(this.gameObject, HealthComponent);
        if (!healthComponent) return State.FAILED;
        const latestDamage = healthComponent.latestDamage;
        if (!latestDamage) return State.FAILED;
        const attacker = latestDamage.damageInitiator;
        if (!attacker) return State.FAILED;
        if (!this.canAttackTarget(attacker)) return State.FAILED;
        this.blackboard.addOrder(new OrderData(OrderType.Attack, { targetGameObject: attacker }));
        return State.SUCCEEDED;
      default:
        console.error("Invalid source for AssignEnemy.");
        return State.FAILED;
    }
  }

  NoEnemiesVisible() {
    // Check if there are no enemies visible to the agent
    return false;
  }

  /** Shared with attack-move; selects only native visible, attackable actors using deterministic ties. */
  getClosestAttackableVisibleEnemy(): Phaser.GameObjects.GameObject | null {
    const visionComponent = getActorComponent(this.gameObject, VisionComponent);
    if (!visionComponent) return null;

    const attackableEnemies = visionComponent.getVisibleEnemies().filter((enemy) => this.canAttackTarget(enemy));
    if (attackableEnemies.length === 0) return null;

    // Deterministic target ordering: closest first, then stable actor identity.
    attackableEnemies.sort((a, b) => {
      const distanceA = DistanceHelper.getTileDistanceBetweenGameObjects(this.gameObject, a);
      const distanceB = DistanceHelper.getTileDistanceBetweenGameObjects(this.gameObject, b);
      if (distanceA === null && distanceB === null) {
        return this.compareEnemyTieBreaker(a, b);
      }
      if (distanceA === null) {
        return 1;
      }
      if (distanceB === null) {
        return -1;
      }
      if (distanceA !== distanceB) {
        return distanceA - distanceB;
      }
      return this.compareEnemyTieBreaker(a, b);
    });

    return attackableEnemies[0]!;
  }

  private compareEnemyTieBreaker(a: Phaser.GameObjects.GameObject, b: Phaser.GameObjects.GameObject): number {
    const aId = getActorComponent(a, IdComponent)?.id;
    const bId = getActorComponent(b, IdComponent)?.id;
    if (aId && bId && aId !== bId) {
      return aId.localeCompare(bId);
    }
    // Fallback key keeps ordering stable even when one side is missing an id.
    const aStable = `${a.name}:${aId ?? ""}`;
    const bStable = `${b.name}:${bId ?? ""}`;
    return aStable.localeCompare(bStable);
  }

  private canAttackTarget(target: Phaser.GameObjects.GameObject): boolean {
    const attackComponent = getActorComponent(this.gameObject, AttackComponent);
    if (!attackComponent) return false;
    return !!attackComponent.getAttack(target);
  }

}
