import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { getActorComponent } from "../../../data/actor-component";
import { getGameObjectCurrentTile } from "../../../data/game-object-helper";
import { isSnapshotApplyInProgress } from "../../../data/scene-data";
import { LevelComponent } from "../../../entity/components/level/level-component";
import { ContainerComponent } from "../../../entity/components/building/container-component";
import { ContainableComponent } from "../../../entity/components/building/containable-component";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { HealthComponent } from "../../../entity/components/combat/components/health-component";
import { getPwActorDefinition } from "../../../prefabs/definitions/actor-definitions";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { SimulationTickService } from "../../../world/services/simulation-tick.service";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { AiObservationVisibilityPolicy } from "../observation/ai-observation-visibility-policy";
import { projectAiCombatProfile } from "../observation/ai-observation-combat-profile";
import type { AiDecisionDispatchEvent } from "../ai-decision-dispatch-event";
import { captureAiRuntimeCreatedActor } from "./capture-ai-runtime-created-actor";
import type { AiRuntimeTacticalBoundaryV1 } from "./ai-runtime-tactical-boundary-v1";

/** Passive, bounded, same-turn truth for fair contact and combat premises. No route query, mutation or extra observer. */
export function captureAiRuntimeTacticalBoundary(
  scene: ProbableWaffleScene, decision: AiDecisionDispatchEvent
): AiRuntimeTacticalBoundaryV1 {
  const playerNumber = decision.identity.playerNumber;
  const policy = new AiObservationVisibilityPolicy(scene, playerNumber);
  const index = getSceneService(scene, ActorIndexSystem);
  const tick = getSceneService(scene, SimulationTickService)?.currentTick ?? null;
  const actors = index?.getAllIdActors() ?? [];
  const points = decision.input?.map?.scoutSearchPoints ?? [];
  const remembered = decision.input?.observation?.actors.filter((actor) =>
    actor.visibility === "last_seen" && actor.logicalPosition.status === "known") ?? [];
  const gaps = [
    ...(!index || tick === null ? ["tactical_authority_missing"] : []),
    ...(actors.length > 256 ? ["tactical_actor_overflow"] : []),
    ...(points.length > 512 ? ["tactical_search_overflow"] : []),
    ...(remembered.length > 32 ? ["tactical_remembered_coverage_overflow"] : [])
  ];
  if (scene.players.length > 16 || scene.players.some((player) => player.playerNumber === undefined))
    gaps.push("tactical_player_roster_invalid");
  return {
    tick, playerNumber, informationPolicy: policy.informationPolicy,
    snapshotRestoreInProgress: isSnapshotApplyInProgress(scene), gaps,
    players: gaps.length ? [] : scene.players.flatMap((player) => player.playerNumber === undefined ? [] : [{
      playerNumber: player.playerNumber, team: player.playerController.data.playerDefinition?.team ?? player.playerNumber,
      defeated: player.playerController.data.leftOrKilled === true
    }]),
    actors: gaps.length ? [] : actors.map((actor) => {
      const health = getActorComponent(actor, HealthComponent);
      const level = getActorComponent(actor, LevelComponent)?.currentLevel ?? 1;
      const parent = getActorComponent(actor, ContainableComponent)?.getContainerOwner();
      const passengers = getActorComponent(actor, ContainerComponent)?.getContainedGameObjects() ?? [];
      if (passengers.length > 64) gaps.push("tactical_transport_membership_overflow");
      return {
        identity: captureAiRuntimeCreatedActor(actor), tile: getGameObjectCurrentTile(actor) ?? null,
        visible: policy.mayObserve(actor), health: health?.healthComponentData.health ?? null,
        armour: health?.healthComponentData.armour ?? null,
        containerId: parent ? getActorComponent(parent, IdComponent)?.id ?? null : null,
        passengerIds: passengers.length > 64 ? [] : passengers.map((passenger) => {
          const id = getActorComponent(passenger, IdComponent)?.id;
          if (!id) gaps.push("tactical_passenger_identity_missing");
          return id ?? "";
        }),
        combat: projectAiCombatProfile(actor, getPwActorDefinition(actor.name, level), true, "owned", tick ?? 0)
      };
    }),
    searchPoints: gaps.length ? [] : points.map((point) => ({
      pointId: point.pointId, tile: { x: point.position.x, y: point.position.y },
      visible: policy.mayObserveTile(point.position)
    })),
    rememberedCoverage: gaps.length ? [] : remembered.flatMap((actor) => {
      if (actor.logicalPosition.status !== "known") return [];
      const position = actor.logicalPosition.value;
      return [{ actorId: actor.actorId, observedTick: actor.observedTick, tiles: Array.from({ length: 25 }, (_, index) => {
        const x = position.x + index % 5 - 2, y = position.y + Math.floor(index / 5) - 2;
        return { x, y, visible: policy.mayObserveTile({ x, y }) };
      }) }];
    })
  };
}
