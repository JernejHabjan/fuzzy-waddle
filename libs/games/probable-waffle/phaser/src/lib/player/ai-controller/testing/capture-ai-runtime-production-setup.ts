import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { getActorComponent } from "../../../data/actor-component";
import { ActorManager } from "../../../data/actor-manager";
import { getGameObjectLogicalTransform } from "../../../data/game-object-helper";
import { isSnapshotApplyInProgress } from "../../../data/scene-data";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { TechTreeService } from "../../../data/tech-tree/tech-tree.service";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { CommandBusService } from "../../../world/services/multiplayer/command-bus.service";
import { SimulationTickService } from "../../../world/services/simulation-tick.service";
import { TilemapComponent } from "../../../world/tilemap/tilemap.component";
import { getSceneComponent, getSceneService } from "../../../world/services/scene-component-helpers";
import type { AiRuntimeProductionSetupV1 } from "./ai-runtime-production-setup-v1";
import { getPwActorDefinition } from "../../../prefabs/definitions/actor-definitions";

/** One bounded native read at the first paused tick-zero poll, after preset applications and before any decision. */
export function captureAiRuntimeProductionSetup(scene: ProbableWaffleScene): AiRuntimeProductionSetupV1 {
  const clock = getSceneService(scene, SimulationTickService);
  const index = getSceneService(scene, ActorIndexSystem);
  const tech = getSceneService(scene, TechTreeService);
  const bus = getSceneService(scene, CommandBusService);
  const tilemap = getSceneComponent(scene, TilemapComponent)?.tilemap;
  const map = scene.baseGameData.gameInstance.data.gameModeData?.map;
  const seed = scene.sys.game.config.seed;
  if (
    !clock ||
    clock.currentTick !== 0 ||
    !clock.isPaused ||
    !index ||
    !tech ||
    !bus ||
    !tilemap ||
    map === undefined ||
    !seed?.length ||
    isSnapshotApplyInProgress(scene)
  ) {
    throw new Error("production_setup_authority_unavailable");
  }
  const indexed = index.getAllIdActors();
  if (
    indexed.length > 256 ||
    scene.players.length > 16 ||
    tilemap.layers.reduce((count, layer) => count + layer.width * layer.height, 0) > 65536
  ) {
    throw new Error("production_setup_overflow");
  }
  const actors = indexed.map((actor) => {
    const actorId = getActorComponent(actor, IdComponent)?.id;
    const position = getGameObjectLogicalTransform(actor);
    const definition = ActorManager.getActorDefinitionFromActor(actor);
    if (actor.scene !== scene || !actorId || !position || !definition)
      throw new Error("production_setup_actor_missing");
    return { actorId, position, definition };
  });
  const players = scene.players.map((player) => {
    const playerNumber = player.playerNumber;
    if (playerNumber === undefined) throw new Error("production_setup_player_missing");
    return {
      playerNumber,
      controller: player.playerController.data,
      state: player.playerState.data,
      tech: [...tech.getPlayerResearch(playerNumber)].sort()
    };
  });
  const content = [...new Set(actors.map((actor) => actor.definition.name))].sort().map((objectName) => {
    if (!objectName) throw new Error("production_setup_content_name_missing");
    const definition = getPwActorDefinition(objectName, null);
    if (!definition) throw new Error("production_setup_content_missing");
    return { objectName, definition };
  });
  return structuredClone({
    tick: 0,
    seed,
    map,
    content,
    actors,
    players,
    commandAuthority: bus.getAuthorityState(),
    topology: tilemap.layers.map((layer) => ({
      name: layer.name,
      width: layer.width,
      height: layer.height,
      cells: layer.data.flatMap((row) =>
        row.map((tile) => ({ index: tile.index, collides: tile.collides, properties: tile.properties }))
      )
    }))
  } satisfies AiRuntimeProductionSetupV1);
}
