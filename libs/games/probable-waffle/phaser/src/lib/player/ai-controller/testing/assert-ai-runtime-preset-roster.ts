import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import type GameProbableWaffleScene from "../../../world/scenes/GameProbableWaffleScene";
import { TechTreeService } from "../../../data/tech-tree/tech-tree.service";
import { getCanonicalActorNameCached } from "../../../data/tech-tree/canonical-actor-name";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { IsoHelper } from "../../../world/tilemap/iso-helper";
import type { AiRuntimePresetWorldV1 } from "./ai-runtime-preset-world-v1";

/** Strict production worlds check both authored inputs and the indexed starting world before any test work. */
export function assertAiRuntimePresetRoster(scene: GameProbableWaffleScene, preset: AiRuntimePresetWorldV1): void {
  if (!preset.requireFactionRoster) return;
  const tech = getSceneService(scene, TechTreeService);
  const index = getSceneService(scene, ActorIndexSystem);
  if (!tech || !index) throw new Error("runtime_preset_roster_services_missing");
  const rosters = new Map<number, ReadonlySet<ObjectNames>>();
  for (const player of scene.players) {
    const owner = player.playerNumber;
    const faction = player.playerController.data.playerDefinition?.factionType;
    if (owner === undefined || faction === undefined) throw new Error("runtime_preset_roster_player_missing");
    rosters.set(owner, new Set(tech.getFactionActorIds(faction).map(getCanonicalActorNameCached)));
  }
  const check = (name: string, owner: number, identity: string) => {
    if (!rosters.get(owner)?.has(getCanonicalActorNameCached(name))) {
      throw new Error(`runtime_preset_foreign_faction_actor:${identity}:${name}:${owner}`);
    }
  };
  for (const [owner] of rosters) {
    for (const actor of index.getOwnedActors(owner)) check(actor.name, owner, "indexed");
  }
  for (const actor of preset.actors) {
    if (actor.owner !== null) check(actor.actorName, actor.owner, actor.fixtureActorId);
    const tile = IsoHelper.isometricWorldToTileXY(scene, actor.position.x, actor.position.y);
    if (
      !Number.isSafeInteger(tile.x) ||
      !Number.isSafeInteger(tile.y) ||
      tile.x < 0 ||
      tile.y < 0 ||
      tile.x >= scene.tilemap.width ||
      tile.y >= scene.tilemap.height
    ) {
      throw new Error(`runtime_preset_tile_out_of_bounds:${actor.fixtureActorId}`);
    }
  }
  for (const queue of preset.queues ?? []) {
    const producer = [...preset.actors, ...(preset.existingActorBindings ?? [])].find(
      (actor) => actor.fixtureActorId === queue.producerFixtureActorId
    );
    if (producer?.owner === undefined || producer.owner === null)
      throw new Error("runtime_preset_roster_queue_owner_missing");
    check(queue.actorName, producer.owner, queue.producerFixtureActorId);
  }
  for (const event of preset.events ?? []) check(event.objectName, event.owner, event.id);
}
