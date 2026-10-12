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

/** Reads only already-fair identities. Invalidation is producer-specific and sticky until a fresh decision binds again. */
export class AiRuntimeExposureBinding {
  private readonly expected = new Map<string, string>();
  private readonly invalid = new Set<string>();
  private readonly threats: readonly string[];
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
    const producers =
      observation?.actors.filter(
        (actor) =>
          actor.relation === "self" &&
          actor.visibility === "owned" &&
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

  /** Removal/reuse cannot preserve a fingerprint by recreating an identical-looking actor between fixed frontiers. */
  invalidate(actorId: string): void {
    if (this.threats.includes(actorId)) this.expected.forEach((_, id) => this.invalid.add(id));
    if (this.expected.has(actorId)) this.invalid.add(actorId);
  }

  read() {
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

  private fingerprint(producerId: string): string | null {
    const index = getSceneService(this.scene, ActorIndexSystem);
    const visibility = new AiObservationVisibilityPolicy(this.scene, this.playerNumber);
    const records = [producerId, ...this.threats].map((id) => {
      const actor = index?.getActorById(id);
      if (!actor || actor.scene !== this.scene) return null;
      const identity = captureAiRuntimeCreatedActor(actor);
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
      if (!tile || !position) return null;
      return {
        identity,
        tile,
        position,
        weapons: getActorComponent(actor, AttackComponent)?.getAttacks() ?? [],
        level: getActorComponent(actor, LevelComponent)?.currentLevel ?? 1
      };
    });
    return records.some((record) => record === null) ? null : JSON.stringify(records);
  }
}
