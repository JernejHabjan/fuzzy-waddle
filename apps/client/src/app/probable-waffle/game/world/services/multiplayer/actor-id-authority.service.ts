import type { ActorId } from "@fuzzy-waddle/api-interfaces";
import { getActorComponent } from "../../../data/actor-component";
import { getGameObjectLogicalTransform } from "../../../data/game-object-helper";
import { IdComponent } from "../../../entity/components/id-component";
import { OwnerComponent } from "../../../entity/components/owner-component";
import { SimulationTickService } from "../simulation-tick.service";
import { getSceneService } from "../scene-component-helpers";
import GameObject = Phaser.GameObjects.GameObject;

const SIM_ID_PREFIX = "sim-";

/**
 * Assigns deterministic actor ids derived from shared simulation context.
 *
 * No host-side actor-id seed relay is required: every peer computes the same id
 * for the same actor spawn context.
 */
export class ActorIdAuthorityService {
  private readonly sequenceBySignature = new Map<string, number>();
  private readonly sessionSalt: string;

  constructor(private readonly scene: Phaser.Scene) {
    const gameInstanceId = "gameInstanceId" in scene ? String((scene as { gameInstanceId?: string }).gameInstanceId ?? "local") : "local";
    const seed = String(scene.sys.game.config.seed?.[0] ?? "seed");
    this.sessionSalt = `${gameInstanceId}|${seed}`;
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  /** Uses explicit id when present; otherwise derives and applies a deterministic local id. */
  applyAuthoritativeOrDeterministicId(actor: GameObject, authoritativeId?: ActorId): ActorId | undefined {
    const idComponent = getActorComponent(actor, IdComponent);
    if (!idComponent) {
      return undefined;
    }

    if (authoritativeId) {
      if (idComponent.id !== authoritativeId) {
        idComponent.setId(authoritativeId);
      }
      return authoritativeId;
    }

    if (this.isDeterministicActorId(idComponent.id)) {
      return idComponent.id;
    }

    const deterministicId = this.createDeterministicId(actor);
    idComponent.setId(deterministicId);
    return deterministicId;
  }

  /** Identifies ids created by this service. */
  isDeterministicActorId(actorId: ActorId | undefined): boolean {
    return !!actorId && actorId.startsWith(SIM_ID_PREFIX);
  }

  /** Builds a stable id from deterministic spawn context for this simulation tick. */
  private createDeterministicId(actor: GameObject): ActorId {
    const tick = getSceneService(this.scene, SimulationTickService)?.currentTick ?? 0;
    const owner = getActorComponent(actor, OwnerComponent)?.getOwner() ?? -1;
    const logicalTransform = getGameObjectLogicalTransform(actor);
    const x = logicalTransform ? Math.round(logicalTransform.x) : 0;
    const y = logicalTransform ? Math.round(logicalTransform.y) : 0;
    const z = logicalTransform ? Math.round(logicalTransform.z) : 0;
    const signature = `${tick}|${actor.name}|${owner}|${x}|${y}|${z}`;
    const nextSequence = (this.sequenceBySignature.get(signature) ?? 0) + 1;
    this.sequenceBySignature.set(signature, nextSequence);

    this.pruneOldSequences(tick);

    const basis = `${this.sessionSalt}|${signature}|${nextSequence}`;
    return `${SIM_ID_PREFIX}${fnv1a32(basis)}`;
  }

  /** Keeps only recent counters to avoid unbounded memory growth. */
  private pruneOldSequences(currentTick: number): void {
    const cutoffTick = currentTick - 200;
    for (const signature of this.sequenceBySignature.keys()) {
      const tickPrefix = Number(signature.split("|", 1)[0]);
      if (Number.isFinite(tickPrefix) && tickPrefix < cutoffTick) {
        this.sequenceBySignature.delete(signature);
      }
    }
  }

  private destroy(): void {
    this.sequenceBySignature.clear();
  }
}

/** FNV-1a 32-bit hash used for fast deterministic id fingerprints across clients. */
function fnv1a32(input: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index++) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
