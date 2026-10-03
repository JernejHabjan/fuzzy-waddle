import Phaser from "phaser";
import { getGameModeFromScene } from "@fuzzy-waddle/platform-game-host/phaser/scene/base.scene";
import type { ActorId } from "@fuzzy-waddle/platform-game-sessions";
import { type ProbableWaffleGameMode, type ProbableWafflePlayer } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiObservedActorV1, AiObservedEffectV1, AiObservationV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import { getActorComponent } from "../../../data/actor-component";
import { ResearchComponent } from "../../../entity/components/research/research-component";
import { researchDefinitions } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/research/research-definitions";
import { AoeZoneManager } from "../../../entity/systems/aoe-zone-manager";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { IsoHelper } from "../../../world/tilemap/iso-helper";
import { getPlayerRelation } from "../../../data/player-relation";
import { AiObservationVisibilityPolicy } from "./ai-observation-visibility-policy";
import { knownValue, millisecondsToSimulationTicks } from "./ai-observation-values";

type GameObject = Phaser.GameObjects.GameObject;

/** Projects only runtime-legal owned research; unavailable prerequisites do not become AI wishes. */
export function projectResearchCandidates(
  actors: readonly AiObservedActorV1[],
  liveById: ReadonlyMap<ActorId, GameObject>
): AiObservationV1["researchCandidates"] {
  const candidates: AiObservationV1["researchCandidates"][number][] = [];
  for (const observed of actors.filter((actor) => actor.relation === "self" && actor.visibility === "owned")) {
    const actor = liveById.get(observed.actorId);
    const research = actor ? getActorComponent(actor, ResearchComponent) : undefined;
    if (!research || research.isResearching) continue;
    for (const researchType of [...research.availableResearch].sort()) {
      if (!research.canStartResearch(researchType).canStart) continue;
      const definition = researchDefinitions[researchType];
      if (!definition || (!definition.upgradesUnit && !definition.unlocksSpell)) continue;
      candidates.push({
        producerId: observed.actorId,
        researchType,
        cost: { ...definition.cost },
        durationTicks: millisecondsToSimulationTicks(definition.researchTime),
        refundPermille: Math.max(0, Math.min(1000, Math.round(definition.refundFactor * 1000))),
        benefit: definition.upgradesUnit
          ? {
              kind: "unit_level",
              targetObjectName: definition.upgradesUnit.unitType,
              targetLevel: definition.upgradesUnit.targetLevel,
              spellType: null
            }
          : { kind: "spell", targetObjectName: null, targetLevel: null, spellType: definition.unlocksSpell ?? null }
      });
    }
  }
  return candidates.sort(
    (left, right) =>
      left.producerId.localeCompare(right.producerId) || left.researchType.localeCompare(right.researchType)
  );
}

export function projectThreatSummary(
  actors: readonly AiObservedActorV1[],
  tick: number
): AiObservationV1["threatSummary"] {
  const enemies = actors.filter((actor) => actor.relation === "enemy");
  return {
    observedTick: tick,
    visibleEnemyActorIds: enemies
      .filter((actor) => actor.visibility === "visible")
      .map((actor) => actor.actorId)
      .sort(),
    rememberedEnemyActorIds: enemies
      .filter((actor) => actor.visibility === "last_seen")
      .map((actor) => actor.actorId)
      .sort(),
    observedCapabilityFamilies: enemies
      .filter((actor) => actor.visibility === "visible")
      .flatMap((actor) => actor.capabilities.map((capability) => capability.family))
      .filter((family, index, values) => values.indexOf(family) === index)
      .sort()
  };
}

/** Projects public mode configuration and locally observable status; mode resolution stays authoritative. */
export function projectModeGoals(
  scene: Phaser.Scene,
  player: ProbableWafflePlayer,
  actors: readonly AiObservedActorV1[]
): AiObservationV1["modeGoals"] {
  const data = getGameModeFromScene<ProbableWaffleGameMode>(scene).data;
  const selfFailed = player.playerController.data.leftOrKilled === true;
  const selfActors = actors
    .filter((actor) => actor.relation === "self")
    .map((actor) => actor.actorId)
    .sort();
  const visibleEnemies = actors
    .filter((actor) => actor.relation === "enemy" && actor.visibility === "visible")
    .map((actor) => actor.actorId)
    .sort();
  const enemyNodes = actors
    .filter(
      (actor) => actor.relation === "enemy" && actor.visibility === "visible" && actor.accessNodeId.status === "known"
    )
    .map((actor) => (actor.accessNodeId.status === "known" ? actor.accessNodeId.value : undefined))
    .filter((node): node is NonNullable<typeof node> => node !== undefined)
    .sort();
  const goals: AiObservationV1["modeGoals"][number][] = [];
  if (data.winConditions.noEnemyPlayersLeft === true) {
    goals.push({
      id: "mode:win:no_enemy_players_left",
      kind: "destroy",
      owner: player.playerNumber!,
      targetActorIds: visibleEnemies,
      targetAccessNodeIds: enemyNodes,
      state: selfFailed ? "failed" : "active"
    });
  }
  if (
    data.loseConditions.allActorsMustBeEliminated === true ||
    data.loseConditions.allBuildingsMustBeEliminated === true
  ) {
    goals.push({
      id: "mode:survive:owned_assets",
      kind: "protect",
      owner: player.playerNumber!,
      targetActorIds: selfActors,
      targetAccessNodeIds: [],
      state: selfFailed ? "failed" : "active"
    });
  }
  if (data.tieConditions.maximumTimeLimitInMinutes !== undefined) {
    goals.push({
      id: "mode:tie:time_limit",
      kind: "survive",
      owner: player.playerNumber!,
      targetActorIds: [],
      targetAccessNodeIds: [],
      state: selfFailed ? "failed" : "active"
    });
  }
  return goals.sort((left, right) => left.id.localeCompare(right.id));
}

export function countUnknownFacts(observation: AiObservationV1 | undefined): number {
  if (!observation) return 0;
  const actorUnknownFacts = observation.actors.reduce(
    (count, actor) =>
      count +
      [
        actor.logicalPosition,
        actor.accessNodeId,
        actor.effectiveLevel,
        actor.queue,
        actor.cost,
        actor.housingCost,
        actor.housingCapacity,
        actor.resourceState
      ].filter((fact) => fact.status === "unknown").length,
    0
  );
  return actorUnknownFacts + (observation.map?.bounds.status === "unknown" ? 1 : 0);
}

/** Projects only self-owned or explicitly scripted-visible zones, never hidden enemy effects. */
/** Enemy/allied zones are admitted only while ordinary owned vision covers their tile. */
export function projectPermittedZones(
  scene: Phaser.Scene,
  player: ProbableWafflePlayer,
  policy: AiObservationVisibilityPolicy,
  tick: number
): AiObservationV1["effects"] {
  const zones = getSceneService(scene, AoeZoneManager)?.getData() ?? [];
  return zones
    .map((zone) => ({
      zone,
      tilePosition: IsoHelper.isometricWorldToTileXY(scene, zone.worldPosition.x, zone.worldPosition.y)
    }))
    .filter(
      ({ zone, tilePosition }) => zone.sourcePlayerId === player.playerNumber || policy.mayObserveTile(tilePosition)
    )
    .map(({ zone, tilePosition }) => {
      const relation = getPlayerRelation(scene, player.playerNumber, zone.sourcePlayerId);
      const friendlySource = relation === "self" || relation === "ally";
      const effect = zone.effectWhileInside;
      const beneficialEffect =
        (effect?.healPerTick ?? 0) > 0 || (effect?.instantHeal ?? 0) > 0 || (effect?.movementSpeedModifier ?? 1) > 1;
      const harmfulEffect =
        (effect?.damagePerTick ?? 0) > 0 ||
        (effect?.instantDamage ?? 0) > 0 ||
        (effect?.movementSpeedModifier ?? 1) < 1;
      const influencesSelf = friendlySource ? zone.affectsAllies : zone.affectsEnemies;
      const influence = !influencesSelf
        ? "mixed"
        : harmfulEffect && beneficialEffect
          ? "mixed"
          : harmfulEffect
            ? "harmful"
            : beneficialEffect
              ? "beneficial"
              : "mixed";
      return {
        effectId: `zone:${zone.id}`,
        owner: zone.sourcePlayerId ?? null,
        relation,
        position: { x: tilePosition.x, y: tilePosition.y, z: 0 },
        targetDomains: ["ground", "water", "air"],
        expiresAt: knownValue(Math.max(tick, tick + millisecondsToSimulationTicks(zone.remainingTime)), tick),
        radius: zone.radius,
        influence
      } satisfies AiObservedEffectV1;
    })
    .sort((left, right) => left.effectId.localeCompare(right.effectId));
}
