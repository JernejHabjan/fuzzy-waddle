import type Phaser from "phaser";
import type { PlayerPawnCooldownType } from "./player-pawn-ai-controller.agent.interface";
import { PawnAiBlackboard } from "./pawn-ai-blackboard";
import { getActorComponent } from "../../data/actor-component";
import { HealthComponent } from "../../entity/components/combat/components/health-component";
import { StatusEffectComponent } from "../../entity/components/status-effect/status-effect-component";
import { AttackComponent } from "../../entity/components/combat/components/attack-component";
import { GathererComponent } from "../../entity/components/resource/gatherer-component";
import { BuilderComponent } from "../../entity/components/construction/builder-component";
import { HealingComponent } from "../../entity/components/combat/components/healing-component";

/** Reads live actor/order status and native component cooldowns; it owns no cached or saved state. */
export class PawnAgentStatus {
  constructor(
    private readonly gameObject: Phaser.GameObjects.GameObject,
    private readonly blackboard: PawnAiBlackboard
  ) {}

  TargetIsAlive() {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return false;
    const target = currentOrder.data.targetGameObject;
    if (!target) return false;
    const healthComponent = getActorComponent(target, HealthComponent);
    if (!healthComponent) return false;
    return healthComponent.alive;
  }

  SelfIsAlive() {
    const healthComponent = getActorComponent(this.gameObject, HealthComponent);
    if (!healthComponent) return true; // if no health component, assume alive
    return healthComponent.alive;
  }

  /** Stunned actors cannot move, attack or cast spells. */
  IsStunned() {
    const statusEffectComponent = getActorComponent(this.gameObject, StatusEffectComponent);
    if (!statusEffectComponent) return false;
    return statusEffectComponent.isStunned();
  }

  /** Slowed actors can still act, with movement speed owned by the movement system. */
  IsSlowed() {
    const statusEffectComponent = getActorComponent(this.gameObject, StatusEffectComponent);
    if (!statusEffectComponent) return false;
    return statusEffectComponent.isSlowed();
  }

  /** Reads the corresponding native component's remaining action cooldown. */
  CooldownReady(type: PlayerPawnCooldownType) {
    switch (type) {
      case "attack":
        const attackComponent = getActorComponent(this.gameObject, AttackComponent);
        if (!attackComponent) return false;
        return attackComponent.remainingCooldown <= 0;
      case "gather":
        const gathererComponent = getActorComponent(this.gameObject, GathererComponent);
        if (!gathererComponent) return false;
        return gathererComponent.remainingCooldown <= 0;
      case "construct":
        const builderComponent1 = getActorComponent(this.gameObject, BuilderComponent);
        if (!builderComponent1) return false;
        return builderComponent1.remainingCooldown <= 0;
      case "heal":
        const healingComponent = getActorComponent(this.gameObject, HealingComponent);
        if (!healingComponent) return false;
        return healingComponent.remainingCooldown <= 0;
      case "repair":
        const builderComponent2 = getActorComponent(this.gameObject, BuilderComponent);
        if (!builderComponent2) return false;
        return builderComponent2.remainingCooldown <= 0;
      default:
        throw new Error("Invalid cooldown type");
    }
  }

  TargetExists() {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return false;
    return !!currentOrder.data.targetGameObject;
  }

  TargetOrLocationExists() {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return false;
    return !!currentOrder.data.targetGameObject || !!currentOrder.data.targetTileLocation;
  }
}
