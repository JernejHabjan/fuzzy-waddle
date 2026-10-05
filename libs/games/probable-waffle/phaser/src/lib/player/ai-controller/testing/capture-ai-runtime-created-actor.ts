import type Phaser from "phaser";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { getActorComponent } from "../../../data/actor-component";
import { getCanonicalActorNameCached } from "../../../data/tech-tree/canonical-actor-name";
import { OwnerComponent } from "../../../entity/components/owner-component";
import { HealthComponent } from "../../../entity/components/combat/components/health-component";
import { ConstructionSiteComponent } from "../../../entity/components/construction/construction-site-component";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import type { AiRuntimeCreatedActorV1 } from "./ai-runtime-created-actor-v1";

/** Samples the real returned/index-registered object; canonical variants use the shared definition registry. */
export function captureAiRuntimeCreatedActor(actor: Phaser.GameObjects.GameObject): AiRuntimeCreatedActorV1 {
  const actorId = getActorComponent(actor, IdComponent)?.id ?? null;
  return {
    actorId, objectName: actor.name, canonicalObjectName: getCanonicalActorNameCached(actor.name),
    playerNumber: getActorComponent(actor, OwnerComponent)?.getOwner() ?? null,
    active: actor.active, alive: !getActorComponent(actor, HealthComponent)?.killed,
    finished: getActorComponent(actor, ConstructionSiteComponent)?.isFinished ?? true,
    indexed: !!actorId && getSceneService(actor.scene, ActorIndexSystem)?.getActorById(actorId) === actor
  };
}
