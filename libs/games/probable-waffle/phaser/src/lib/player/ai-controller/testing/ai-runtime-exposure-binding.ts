import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import type { AiRuntimeProductionFactV1 } from "./ai-runtime-production-fact-v1";
import { getActorComponent } from "../../../data/actor-component";
import { getGameObjectCurrentTile, getGameObjectLogicalTransform } from "../../../data/game-object-helper";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { AttackComponent } from "../../../entity/components/combat/components/attack-component";
import { LevelComponent } from "../../../entity/components/level/level-component";
import { captureAiRuntimeCreatedActor } from "./capture-ai-runtime-created-actor";
import { AiObservationVisibilityPolicy } from "../observation/ai-observation-visibility-policy";
import { DistanceHelper } from "../../../library/distance-helper";
import { getActorElevation, getHighGroundRangeBonus } from "../../../entity/components/combat/high-ground.helper";
import { RepresentableComponent } from "../../../entity/components/representable-component";
import type Phaser from "phaser";
import type { AiRuntimeCreatedActorV1 } from "./ai-runtime-created-actor-v1";
import { HealthComponent } from "../../../entity/components/combat/components/health-component";

/** Preserves only the measured exposure class of already-fair identities. Band/profile changes invalidate until a fresh decision. */
export class AiRuntimeExposureBinding {
  private readonly expected = new Map<string, string>();
  private readonly invalid = new Set<string>();
  private readonly threats: readonly string[];
  /** Only identities already visible at the decision; discarded with this decision's binding. */
  private readonly knownThreats = new Map<string, Phaser.GameObjects.GameObject>();
  private readonly witnessedDeaths = new Set<string>();
  readonly selectedSequence: number;

  constructor(
    private readonly scene: ProbableWaffleScene,
    private readonly playerNumber: number,
    fact: Extract<AiRuntimeProductionFactV1, { kind: "decision_selected" }>
  ) {
    const input = fact.decision.input;
    const observation = input?.observation;
    const exposure = input?.producerExposure;
    this.selectedSequence = fact.sequence;
    this.threats =
      observation?.actors
        .filter((actor) => actor.relation === "enemy" && actor.visibility === "visible")
        .map((actor) => actor.actorId)
        .sort() ?? [];
    const index = getSceneService(this.scene, ActorIndexSystem);
    for (const id of this.threats) {
      const actor = index?.getActorById(id);
      if (actor) this.knownThreats.set(id, actor);
    }
    const producers =
      observation?.actors.filter(
        (actor) =>
          actor.relation === "self" &&
          actor.visibility === "owned" &&
          (actor.constructionProgress?.status !== "known" || actor.constructionProgress.value >= 100) &&
          (actor.queue.status === "known" || actor.capabilities.some((capability) => capability.family === "produce"))
      ) ?? [];
    if (
      !exposure ||
      exposure.tick !== fact.tick ||
      observation?.tick !== fact.tick ||
      exposure.gaps.length ||
      producers.length * this.threats.length !== exposure.pairs.length
    )
      return;
    for (const producer of producers) {
      const pairs = exposure.pairs.filter((pair) => pair.producerActorId === producer.actorId);
      if (pairs.length !== this.threats.length || pairs.some((pair) => pair.status === "unavailable")) continue;
      const fingerprint = this.fingerprint(producer.actorId);
      if (fingerprint !== null) this.expected.set(producer.actorId, fingerprint);
    }
  }

  /** A still-visible native death retires only that fair threat. Unknown removal and reuse stay sticky. */
  invalidate(actorId: string, removal?: AiRuntimeCreatedActorV1): void {
    const actor = this.knownThreats.get(actorId);
    if (
      actor &&
      removal?.actorId === actorId &&
      removal.active &&
      !removal.alive &&
      !removal.indexed &&
      actor.scene === this.scene &&
      actor.active &&
      getActorComponent(actor, HealthComponent)?.killed &&
      new AiObservationVisibilityPolicy(this.scene, this.playerNumber).mayObserve(actor) &&
      JSON.stringify(captureAiRuntimeCreatedActor(actor)) === JSON.stringify(removal) &&
      !getSceneService(this.scene, ActorIndexSystem)?.getActorById(actorId)
    ) {
      for (const [id, expected] of this.expected) {
        if (this.fingerprint(id, actorId) !== expected) this.invalid.add(id);
      }
      this.witnessedDeaths.add(actorId);
      // Removing a witnessed dead threat never improves the dated decision's classification. The reader retains
      // its original pairs until the next decision; only the surviving native records need continuity now.
      for (const id of this.expected.keys()) {
        const fingerprint = this.fingerprint(id);
        if (fingerprint === null) this.invalid.add(id);
        else this.expected.set(id, fingerprint);
      }
      return;
    }
    if (this.threats.includes(actorId)) this.expected.forEach((_, id) => this.invalid.add(id));
    if (this.expected.has(actorId)) this.invalid.add(actorId);
  }

  read() {
    const index = getSceneService(this.scene, ActorIndexSystem);
    if ([...this.witnessedDeaths].some((id) => index?.getActorById(id))) {
      this.expected.forEach((_, id) => this.invalid.add(id));
    }
    const validProducerIds: string[] = [];
    for (const [id, expected] of this.expected) {
      if (!this.invalid.has(id) && this.fingerprint(id) !== expected) this.invalid.add(id);
      if (!this.invalid.has(id)) validProducerIds.push(id);
    }
    return {
      selectedSequence: this.selectedSequence,
      valid: this.expected.size > 0 && this.invalid.size === 0,
      validProducerIds: validProducerIds.sort()
    };
  }

  private fingerprint(producerId: string, dyingThreatId?: string): string | null {
    const index = getSceneService(this.scene, ActorIndexSystem);
    const visibility = new AiObservationVisibilityPolicy(this.scene, this.playerNumber);
    const producer = index?.getActorById(producerId);
    if (!producer) return null;
    const records = [producerId, ...this.threats.filter((id) => !this.witnessedDeaths.has(id))].map((id) => {
      const actor = id === dyingThreatId ? this.knownThreats.get(id) : index?.getActorById(id);
      if (!actor || actor.scene !== this.scene) return null;
      if (id !== producerId && actor !== this.knownThreats.get(id)) return null;
      const sampled = captureAiRuntimeCreatedActor(actor);
      const identity = id === dyingThreatId ? { ...sampled, alive: true, indexed: true } : sampled;
      if (
        !identity.active ||
        !identity.alive ||
        !identity.indexed ||
        !identity.finished ||
        (identity.playerNumber !== this.playerNumber && !visibility.mayObserve(actor))
      )
        return null;
      const tile = getGameObjectCurrentTile(actor),
        position = getGameObjectLogicalTransform(actor);
      if (!tile || !position || !getActorComponent(actor, RepresentableComponent)) return null;
      const component = getActorComponent(actor, AttackComponent);
      const weapons = component?.getAttacks() ?? [];
      const selected = id !== producerId && weapons.length ? component?.getAttack(producer) : null;
      const distance = selected ? DistanceHelper.getTileDistanceBetweenGameObjects(actor, producer) : null;
      if (id !== producerId && weapons.length && (!selected || distance === null)) return null;
      const bonus = selected ? getHighGroundRangeBonus(actor, producer, selected) : 0;
      return {
        identity,
        // Decision distances retain their original date. Continuity proves the same native band at every frontier,
        // rather than rejecting harmless movement outside that band. Lost visibility/identity remains sticky.
        ...(id === producerId ? { tile, position } : { elevation: getActorElevation(actor) }),
        selected,
        withinSelectedWeaponBand:
          selected && distance !== null
            ? selected.damage > 0 && distance >= selected.minRange && distance <= selected.range + bonus
            : null,
        highGroundBonus: bonus,
        weapons,
        level: getActorComponent(actor, LevelComponent)?.currentLevel ?? 1
      };
    });
    return records.some((record) => record === null) ? null : JSON.stringify(records);
  }
}
