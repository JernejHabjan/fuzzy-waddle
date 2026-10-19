import Phaser from "phaser";
import { Subscription } from "rxjs";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { getActorComponent } from "../../../data/actor-component";
import { getGameObjectCurrentTile } from "../../../data/game-object-helper";
import { isSnapshotApplyInProgress } from "../../../data/scene-data";
import { AttackComponent } from "../../../entity/components/combat/components/attack-component";
import { HealingComponent } from "../../../entity/components/combat/components/healing-component";
import { HealthComponent } from "../../../entity/components/combat/components/health-component";
import { SpellComponent } from "../../../entity/components/combat/components/spell-component";
import { StatusEffectComponent } from "../../../entity/components/status-effect/status-effect-component";
import { FlyingComponent } from "../../../entity/components/movement/flying-component";
import { DistanceHelper } from "../../../library/distance-helper";
import { getHighGroundRangeBonus } from "../../../entity/components/combat/high-ground.helper";
import { SimulationTickService } from "../../../world/services/simulation-tick.service";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { captureAiRuntimeCreatedActor } from "./capture-ai-runtime-created-actor";
import type { AiRuntimeCombatOperationV1 } from "./ai-runtime-combat-operation-v1";

/** Owned by the existing explicit combat capture. Passive callbacks and call-through wrappers share its fact budget. */
export class AiRuntimeCombatCapture {
  private readonly actors = new Map<Phaser.GameObjects.GameObject, Subscription>();
  private disposed = false;

  constructor(
    private readonly scene: ProbableWaffleScene,
    private readonly append: (player: number, operation: AiRuntimeCombatOperationV1) => void,
    private readonly lose: (reason: string) => void
  ) {}

  /** Called by the existing inventory scan; component initialization can follow index registration. */
  watch(actor: Phaser.GameObjects.GameObject): void {
    if (this.disposed || actor.scene !== this.scene) return;
    let cleanup = this.actors.get(actor);
    if (!cleanup) {
      if (this.actors.size >= 256) { this.lose("combat_actor_subscription_overflow"); return; }
      cleanup = new Subscription();
      this.actors.set(actor, cleanup);
    }
    const installed = this.installed.get(actor) ?? new Set<object>();
    this.installed.set(actor, installed);
    const attack = getActorComponent(actor, AttackComponent);
    if (attack && !installed.has(attack)) {
      installed.add(attack);
      const original = attack.useAttack;
      const owned = cleanup;
      const wrapper: typeof original = (target) => {
        if (this.disposed || owned.closed) return original.call(attack, target);
        const sampled = this.sampleAttack(actor, attack, target);
        if (sampled) this.record({ ...sampled, kind: "attack_requested" });
        const result = original.call(attack, target);
        try {
          if (sampled && attack.remainingCooldown > 0) this.record({ ...sampled, kind: "attack_committed" });
        } catch { this.lose("combat_attack_return_reader_failed"); }
        return result;
      };
      attack.useAttack = wrapper;
      cleanup.add(() => { if (attack.useAttack === wrapper) attack.useAttack = original; });
    }
    const healing = getActorComponent(actor, HealingComponent);
    if (healing && !installed.has(healing)) {
      installed.add(healing);
      const original = healing.heal;
      const owned = cleanup;
      const wrapper: typeof original = (target) => {
        if (this.disposed || owned.closed) return original.call(healing, target);
        let beforeHealth: number | null = null;
        try { beforeHealth = getActorComponent(target, HealthComponent)?.healthComponentData.health ?? null; }
        catch { this.lose("combat_heal_start_reader_failed"); }
        const result = original.call(healing, target);
        this.project(() => ({ ...this.boundary(actor), kind: "heal_returned", target: captureAiRuntimeCreatedActor(target),
          beforeHealth, afterHealth: getActorComponent(target, HealthComponent)?.healthComponentData.health ?? null }));
        return result;
      };
      healing.heal = wrapper;
      cleanup.add(() => { if (healing.heal === wrapper) healing.heal = original; });
    }
    const status = getActorComponent(actor, StatusEffectComponent);
    if (status && !installed.has(status)) {
      installed.add(status);
      cleanup.add(status.effectApplied.subscribe((effect) => this.project(() => ({
        ...this.boundary(actor), kind: "status_applied", effect: structuredClone(effect)
      }))));
      cleanup.add(status.effectRemoved.subscribe((effectType) => this.project(() => ({
        ...this.boundary(actor), kind: "status_removed", effectType
      }))));
    }
    const spell = getActorComponent(actor, SpellComponent);
    if (spell && !installed.has(spell)) {
      installed.add(spell);
      cleanup.add(spell.spellCooldownStarted.subscribe((spellType) => this.project(() => ({
        ...this.boundary(actor), kind: "spell_cooldown_started", spellType
      }))));
    }
  }

  private readonly installed = new WeakMap<Phaser.GameObjects.GameObject, Set<object>>();

  unwatch(actor: Phaser.GameObjects.GameObject): void {
    this.actors.get(actor)?.unsubscribe();
    this.actors.delete(actor);
    this.installed.delete(actor);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const actor of this.actors.keys()) this.unwatch(actor);
  }

  private boundary(actor: Phaser.GameObjects.GameObject) {
    return {
      actor: captureAiRuntimeCreatedActor(actor), actorTile: getGameObjectCurrentTile(actor) ?? null,
      clockTick: getSceneService(this.scene, SimulationTickService)?.currentTick ?? null,
      sceneActive: this.scene.sys?.isActive() ?? false, snapshotRestoreInProgress: isSnapshotApplyInProgress(this.scene), gaps: []
    };
  }

  /** A failed diagnostic projection must not suppress or replace the original gameplay call. */
  private sampleAttack(actor: Phaser.GameObjects.GameObject, attack: AttackComponent, target: Phaser.GameObjects.GameObject) {
    try {
      const weapon = attack.remainingCooldown <= 0 ? attack.getAttack(target) : null;
      return weapon ? {
        ...this.boundary(actor), target: captureAiRuntimeCreatedActor(target),
        targetTile: getGameObjectCurrentTile(target) ?? null, weapon: structuredClone(weapon),
        distance: DistanceHelper.getTileDistanceBetweenGameObjects(actor, target),
        highGroundRangeBonus: getHighGroundRangeBonus(actor, target, weapon),
        targetFlying: !!getActorComponent(target, FlyingComponent),
        stunned: getActorComponent(actor, StatusEffectComponent)?.isStunned() ?? false
      } : undefined;
    } catch { this.lose("combat_attack_start_reader_failed"); return undefined; }
  }

  private record(operation: AiRuntimeCombatOperationV1): void {
    if (this.disposed || operation.actor.playerNumber === null) return;
    try { this.append(operation.actor.playerNumber, operation); }
    catch { this.lose("combat_operation_append_failed"); }
  }

  private project(read: () => AiRuntimeCombatOperationV1): void {
    if (this.disposed) return;
    try { this.record(read()); }
    catch { this.lose("combat_operation_reader_failed"); }
  }
}
