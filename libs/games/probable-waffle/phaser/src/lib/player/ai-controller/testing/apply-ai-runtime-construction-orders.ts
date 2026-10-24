import type Phaser from "phaser";
import { ProbableWaffleGameCommandTypes, type GameCommandOutcome } from "@fuzzy-waddle/probable-waffle-protocol";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { getActorComponent } from "../../../data/actor-component";
import { getPlayer } from "../../../data/scene-data";
import { OwnerComponent } from "../../../entity/components/owner-component";
import { ConstructionSiteComponent } from "../../../entity/components/construction/construction-site-component";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { SimulationTickService } from "../../../world/services/simulation-tick.service";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { CommandBusService } from "../../../world/services/multiplayer/command-bus.service";
import { IsoHelper } from "../../../world/tilemap/iso-helper";
import type { AiRuntimeConstructionOrderV1 } from "./ai-runtime-construction-order-v1";
import type { AiRuntimeConstructionApplicationV1 } from "./ai-runtime-construction-application-v1";

/**
 * Seed unfinished work through normal validation/assignment at paused tick zero. A rejected command, ambiguous
 * site, cross-owner builder or missing physical component aborts setup. No progress, payment or completion is injected.
 */
export function applyAiRuntimeConstructionOrders(
  scene: ProbableWaffleScene,
  fixtureId: string,
  orders: readonly AiRuntimeConstructionOrderV1[],
  actors: Map<string, Phaser.GameObjects.GameObject>,
  actorIds: Record<string, string>
): AiRuntimeConstructionApplicationV1[] {
  if (!orders.length) return [];
  const bus = getSceneService(scene, CommandBusService);
  const index = getSceneService(scene, ActorIndexSystem);
  const ticks = getSceneService(scene, SimulationTickService);
  if (!bus || !index || !ticks || ticks.currentTick !== 0 || !ticks.isPaused) {
    throw new Error("runtime_construction_setup_boundary_missing");
  }
  const assignedBuilders = new Set<string>();
  return orders.map((order) => {
    if (actors.has(order.fixtureActorId)) throw new Error("runtime_construction_role_reused");
    const builders = order.builderFixtureActorIds.map((role) => actors.get(role));
    const owner = builders[0] && getActorComponent(builders[0], OwnerComponent)?.getOwner();
    const player = owner === undefined ? undefined : getPlayer(scene, owner);
    const builderIds = builders.map((actor) => actor && getActorComponent(actor, IdComponent)?.id);
    if (!player || owner === undefined || builders.length === 0 || builders.some((actor) =>
      !actor || !actor.active || actor.scene !== scene || getActorComponent(actor, OwnerComponent)?.getOwner() !== owner
    ) || builderIds.some((id) => !id || assignedBuilders.has(id)) || new Set(builderIds).size !== builders.length) {
      throw new Error(`runtime_construction_builders_invalid:${order.fixtureActorId}`);
    }
    const ids = builderIds.filter((id): id is string => typeof id === "string");
    const beforeIds = new Set(index.getAllIdActors().map((actor) => getActorComponent(actor, IdComponent)?.id));
    const outcomes: GameCommandOutcome[] = [];
    const before = { ...player.getResources() };
    const listener = bus.commandOutcome$.subscribe((outcome) => outcomes.push(structuredClone(outcome)));
    const receipt = (() => {
      try {
        return bus.dispatchDeterministic({
          type: ProbableWaffleGameCommandTypes.Construct,
          playerNumber: owner,
          actorIds: ids,
          actorName: order.actorName,
          tileVec3: { ...IsoHelper.isometricWorldToTileXY(scene, order.position.x, order.position.y), z: order.position.z },
          siteKey: `fixture:${fixtureId}:${order.fixtureActorId}`
        }, "human");
      } finally {
        listener.unsubscribe();
      }
    })();
    if (receipt.status !== "dispatched" || receipt.command.type !== ProbableWaffleGameCommandTypes.Construct ||
        !receipt.command.execution) throw new Error(`runtime_construction_dispatch_failed:${order.fixtureActorId}`);
    const applied = outcomes.filter((outcome) =>
      outcome.commandId === receipt.command.execution?.commandId && outcome.playerNumber === owner
    );
    const links = [...new Set(applied.filter((outcome) => outcome.kind === "applied")
      .flatMap((outcome) => outcome.worldLinkIds))];
    const linkedId = links[0];
    const site = links.length === 1 && linkedId ? index.getActorById(linkedId) : undefined;
    if (!site || !site.active || site.scene !== scene ||
        !getActorComponent(site, ConstructionSiteComponent) ||
        getActorComponent(site, OwnerComponent)?.getOwner() !== owner ||
        applied.some((outcome) => outcome.kind === "failed" || outcome.kind === "rejected")) {
      throw new Error(`runtime_construction_not_applied:${order.fixtureActorId}`);
    }
    const siteActorId = getActorComponent(site, IdComponent)?.id;
    if (!siteActorId || beforeIds.has(siteActorId) || Object.values(actorIds).includes(siteActorId) ||
        actorIds[order.fixtureActorId] !== undefined) throw new Error("runtime_construction_identity_missing");
    actors.set(order.fixtureActorId, site);
    actorIds[order.fixtureActorId] = siteActorId;
    ids.forEach((id) => assignedBuilders.add(id));
    return {
      fixtureActorId: order.fixtureActorId, siteActorId, command: structuredClone(receipt.command), outcomes: applied,
      resourcesBefore: before, resourcesAfter: { ...player.getResources() }
    };
  });
}
