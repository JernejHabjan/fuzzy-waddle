import type Phaser from "phaser";
import { Subscription } from "rxjs";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { NavigationService } from "../../../world/services/navigation.service";
import { SimulationTickService } from "../../../world/services/simulation-tick.service";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { getActorComponent } from "../../../data/actor-component";
import { isRecord, hasOnlyKeys } from "./ai-runtime-fixture-values";
import type { AiRuntimePresetWorldV1 } from "./ai-runtime-preset-world-v1";
import { recordAiRuntimePresetEventV1 } from "./ai-runtime-browser-test-config";

/** Finite actor-scoped route-service null responses. This changes test infrastructure, never native map connectivity. */
export function validAiRuntimeRouteOutages(value: unknown, roles: ReadonlySet<string>): boolean {
  if (value === undefined) return true;
  if (!Array.isArray(value) || value.length > 8) return false;
  const ids = new Set<string>();
  return value.every((entry) => {
    if (!isRecord(entry) || !hasOnlyKeys(entry, ["id", "fromTick", "throughTick", "fixtureActorIds"])) return false;
    const id = entry["id"], from = entry["fromTick"], through = entry["throughTick"], actors = entry["fixtureActorIds"];
    if (typeof id !== "string" || !/^[a-z0-9][a-z0-9-]{2,63}$/.test(id) || ids.has(id) ||
        typeof from !== "number" || !Number.isSafeInteger(from) || from < 1 || typeof through !== "number" ||
        !Number.isSafeInteger(through) || through < from || through > 100000 || through - from > 1000 ||
        !Array.isArray(actors) || !actors.length || actors.length > 32 || new Set(actors).size !== actors.length ||
        actors.some((role) => typeof role !== "string" || !roles.has(role))) return false;
    ids.add(id);
    return true;
  });
}

/** Existing native query owners see a failed request; retained wrappers pass through after cleanup or the fixed deadline. */
export function installAiRuntimeRouteOutages(
  scene: ProbableWaffleScene, preset: AiRuntimePresetWorldV1,
  actors: ReadonlyMap<string, Phaser.GameObjects.GameObject>
): void {
  if (!preset.routeOutages?.length) return;
  const navigation = getSceneService(scene, NavigationService), clock = getSceneService(scene, SimulationTickService);
  if (!navigation || !clock) throw new Error("runtime_route_outage_services_missing");
  const entries = preset.routeOutages.map((entry) => ({ ...entry,
    actors: entry.fixtureActorIds.map((role) => {
      const actor = actors.get(role);
      if (!actor || actor.scene !== scene) throw new Error(`runtime_route_outage_actor_missing:${role}`);
      return actor;
    }), observed: false }));
  const cleanup = new Subscription();
  const blocked = (actor: Phaser.GameObjects.GameObject) => {
    if (cleanup.closed || actor.scene !== scene) return false;
    const entry = entries.find((entry) => clock.currentTick >= entry.fromTick && clock.currentTick <= entry.throughTick &&
      entry.actors.includes(actor));
    if (!entry) return false;
    if (!entry.observed) {
      entry.observed = true;
      recordAiRuntimePresetEventV1({ id: entry.id, tick: clock.currentTick, affectedActors: 1,
        subjectName: actor.name, affectedActorId: getActorComponent(actor, IdComponent)?.id ?? null });
    }
    return true;
  };
  const original = navigation.findPathFromGameObjectToTile;
  const dynamic = navigation.findPathFromGameObjectToTileAvoidingDynamicBlockers;
  const simpleWrapper: typeof original = (actor, to) => blocked(actor) ? Promise.resolve(null) : original.call(navigation, actor, to);
  const dynamicWrapper: typeof dynamic = (actor, to, blockers) => blocked(actor) ? Promise.resolve(null) :
    dynamic.call(navigation, actor, to, blockers);
  navigation.findPathFromGameObjectToTile = simpleWrapper;
  navigation.findPathFromGameObjectToTileAvoidingDynamicBlockers = dynamicWrapper;
  cleanup.add(() => {
    if (navigation.findPathFromGameObjectToTile === simpleWrapper) navigation.findPathFromGameObjectToTile = original;
    if (navigation.findPathFromGameObjectToTileAvoidingDynamicBlockers === dynamicWrapper)
      navigation.findPathFromGameObjectToTileAvoidingDynamicBlockers = dynamic;
  });
  const lastTick = Math.max(...entries.map((entry) => entry.throughTick));
  cleanup.add(clock.tick$.subscribe(() => { if (clock.currentTick > lastTick) cleanup.unsubscribe(); }));
  cleanup.add(scene.onShutdown.subscribe(() => cleanup.unsubscribe()));
}
