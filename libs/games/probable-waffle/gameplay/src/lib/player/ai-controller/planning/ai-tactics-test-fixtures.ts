import { FactionType, ObjectNames, ProbableWaffleAiDifficulty } from "@fuzzy-waddle/probable-waffle-protocol";
import { SpellType } from "../../../entity/components/combat/spell-type";
import { createAiBrainStateV1 } from "../brain/create-ai-brain-state-v1";
import { aiDeadline } from "../contracts/ai-core-types";
import type { AiBrainStateV1, AiSquadStateV1 } from "../contracts/ai-brain-state-v1";

import type { AiDomainV1, AiObservedActorV1, AiObservationV1 } from "../contracts/ai-observation-v1";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import { createAiTestObservation, createAiTestOwnedActor } from "../testing/ai-test-fixtures";
import { AiTacticsManager } from "./ai-tactics-manager";

export const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);

export function requireValue<T>(value: T | undefined, reason: string): T {
  if (value === undefined) throw new Error(reason);
  return value;
}

/** Supplies observed weapons, health and optional support facts for pure tactical controls. */
export function combatActor(
  actorId: string,
  relation: "self" | "enemy",
  x: number,
  domain: AiDomainV1 = "ground",
  healthPermille = 1000,
  options: {
    readonly damage?: number;
    readonly heal?: number;
    readonly spell?: boolean;
    readonly autocast?: boolean;
    readonly targetDomains?: readonly AiDomainV1[];
    readonly capabilityFamilies?: readonly string[];
    readonly mainBuilding?: boolean;
  } = {}
): AiObservedActorV1 {
  const damage = options.damage ?? 10;
  return {
    ...createAiTestOwnedActor(actorId),
    objectName: ObjectNames.TivaraMacemanMale,
    owner: relation === "self" ? 1 : 2,
    relation,
    visibility: relation === "self" ? "owned" : "visible",
    logicalPosition: { status: "known", value: { x, y: 0, z: 0 }, observedTick: 100 },
    capabilities: ["attack", ...(options.capabilityFamilies ?? [])].map((family) => ({
      id: `${actorId}:${family}`,
      family,
      level: 1,
      domains: [domain],
      targetDomains: ["ground", "water", "air"],
      capacity: { status: "known" as const, value: 0, observedTick: 100 }
    })),
    healthPermille: { status: "known", value: healthPermille, observedTick: 100 },
    combatProfile: {
      status: "known",
      observedTick: 100,
      value: {
        maxHealth: 100,
        maxArmour: 20,
        armourPermille: 1000,
        passiveRegenerationPerSecond: 0,
        attacks: [
          {
            damage,
            cooldownTicks: 20,
            range: 5,
            minRange: 2,
            highGroundRangeBonus: 1,
            impactDelayTicks: 4,
            areaRadius: 0,
            targetDomains: options.targetDomains ?? ["ground", "water", "air"]
          }
        ],
        healing: options.heal ? { amount: options.heal, cooldownTicks: 20, remainingCooldownTicks: 0, range: 5 } : null,
        spells: options.spell
          ? [
              {
                spellType: SpellType.Firestorm,
                ready: true,
                researched: true,
                autocast: options.autocast ?? false,
                range: 8,
                areaRadius: 3,
                targetAllies: false,
                targetEnemies: true,
                targetSelf: false,
                targetDomains: ["ground"],
                instantDamage: 5,
                periodicDamage: 25,
                instantHeal: 0,
                periodicHeal: 0,
                stunTicks: 0,
                slowTicks: 0,
                zoneDurationTicks: 100,
                summons: false,
                summonDurationTicks: null
              }
            ]
          : [],
        statuses: []
      }
    },
    ...(options.mainBuilding ? { mainBuilding: { status: "known" as const, value: true, observedTick: 100 } } : {}),
    containedInActorId: null
  };
}

/** Creates one dated mission without assuming movement or damage has applied. */
export function squad(squadId: string, role: AiSquadStateV1["role"], actorIds: readonly string[]): AiSquadStateV1 {
  return {
    squadId: squadId as AiSquadStateV1["squadId"],
    role,
    domain: "ground",
    actorIds,
    objectiveId: null,
    state: "ready",
    lifecycle: {
      targetPlayerNumber: 2,
      targetRegionId: "access:front",
      protectedBaseId: role === "defense" ? "base:home" : null,
      rallyNodeId: "access:home",
      retreatNodeId: "access:home",
      createdTick: 0,
      assemblyDeadline: aiDeadline(200),
      effectDeadline: aiDeadline(1200),
      lastUsefulEffectTick: null,
      recoveryAttempt: 0,
      terminalReason: null
    }
  };
}

/** Keeps the fixture's committed squad state separate from each new observation. */
export function fixtureState(squads: readonly AiSquadStateV1[]): AiBrainStateV1 {
  const state = createAiBrainStateV1({
    playerNumber: 1,
    faction: FactionType.Tivara,
    profile,
    tick: 0,
    archetypeId: "balanced"
  });
  return {
    ...state,
    bases: [
      {
        baseId: "base:home",
        anchorActorId: "main",
        memberActorIds: [],
        active: true,
        anchorPosition: { x: 0, y: 0, z: 0 }
      }
    ],
    squads
  };
}

/** Builds permitted combat and placement facts; it does not represent an applied Phaser world. */
export function observation(actors: readonly AiObservedActorV1[], tick = 100): AiObservationV1 {
  return {
    ...createAiTestObservation(),
    tick,
    actors,
    map: {
      bounds: { status: "known", value: { width: 32, height: 32 }, observedTick: tick },
      staticRevision: 1,
      frontierAccessNodeIds: [],
      scoutCoverageAccessNodeIds: [],
      dynamicObstacleActorIds: [],
      regionGeneration: { generation: 1, status: "ready", continuationCursor: 0 },
      constructionCells: [
        {
          tileKey: "0,0",
          position: { x: 0, y: 0, z: 0 },
          groundPassable: true,
          waterPassable: true,
          elevation: 0,
          observedBlocked: false
        }
      ]
    },
    threatSummary: {
      observedTick: tick,
      visibleEnemyActorIds: actors.filter((actor) => actor.relation === "enemy").map((actor) => actor.actorId),
      rememberedEnemyActorIds: [],
      observedCapabilityFamilies: ["attack"]
    }
  };
}

export const manager = new AiTacticsManager(profile);
