import type { ActorId } from "@fuzzy-waddle/api-interfaces";
import { getActorComponent } from "../../data/actor-component";
import { getGameObjectLogicalTransform } from "../../data/game-object-helper";
import { IdComponent } from "../../entity/components/id-component";
import { OwnerComponent } from "../../entity/components/owner-component";
import { SimulationTickService } from "./simulation-tick.service";
import { getSceneService } from "./scene-component-helpers";
import GameObject = Phaser.GameObjects.GameObject;

const SIM_ID_PREFIX = "sim-";

export class ActorIdAuthorityService {
  private readonly sequenceByTick = new Map<number, number>();
  private readonly sessionSalt: string;

  constructor(private readonly scene: Phaser.Scene) {
    const gameInstanceId = "gameInstanceId" in scene ? String((scene as { gameInstanceId?: string }).gameInstanceId ?? "local") : "local";
    const seed = String(scene.sys.game.config.seed?.[0] ?? "seed");
    this.sessionSalt = `${gameInstanceId}|${seed}`;
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

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

  isDeterministicActorId(actorId: ActorId | undefined): boolean {
    return !!actorId && actorId.startsWith(SIM_ID_PREFIX);
  }

  private createDeterministicId(actor: GameObject): ActorId {
    const tick = getSceneService(this.scene, SimulationTickService)?.currentTick ?? 0;
    const nextSequence = (this.sequenceByTick.get(tick) ?? 0) + 1;
    this.sequenceByTick.set(tick, nextSequence);

    this.pruneOldTicks(tick);

    const owner = getActorComponent(actor, OwnerComponent)?.getOwner() ?? -1;
    const logicalTransform = getGameObjectLogicalTransform(actor);
    const x = logicalTransform ? Math.round(logicalTransform.x) : 0;
    const y = logicalTransform ? Math.round(logicalTransform.y) : 0;
    const z = logicalTransform ? Math.round(logicalTransform.z) : 0;
    const basis = `${this.sessionSalt}|${tick}|${nextSequence}|${actor.name}|${owner}|${x}|${y}|${z}`;
    return `${SIM_ID_PREFIX}${fnv1a32(basis)}`;
  }

  private pruneOldTicks(currentTick: number): void {
    const cutoff = currentTick - 200;
    for (const tick of this.sequenceByTick.keys()) {
      if (tick < cutoff) {
        this.sequenceByTick.delete(tick);
      }
    }
  }

  private destroy(): void {
    this.sequenceByTick.clear();
  }
}

function fnv1a32(input: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index++) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
