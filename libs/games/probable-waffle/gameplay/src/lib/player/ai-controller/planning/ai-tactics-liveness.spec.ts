import { FactionType, ObjectNames, ProbableWaffleAiDifficulty } from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiBrainStateV1 } from "../brain/create-ai-brain-state-v1";
import { aiDeadline } from "../contracts/ai-core-types";
import type { AiBrainStateV1, AiSquadStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiObservedActorV1, AiObservationV1 } from "../contracts/ai-observation-v1";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import { createAiTestObservation, createAiTestOwnedActor } from "../testing/ai-test-fixtures";
import { AiTacticsManager } from "./ai-tactics-manager";

const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
const manager = new AiTacticsManager(profile);

function actor(actorId: string, relation: "self" | "enemy", health: number, attackDamage: number): AiObservedActorV1 {
  const own = createAiTestOwnedActor(actorId);
  return {
    ...own,
    objectName: relation === "self" ? ObjectNames.TivaraMacemanMale : ObjectNames.Sandhold,
    owner: relation === "self" ? 1 : 2,
    relation,
    visibility: relation === "self" ? "owned" : "visible",
    logicalPosition: {
      status: "known",
      value: { x: relation === "self" ? 1 : 4, y: 0, z: 0 },
      observedTick: 100
    },
    capabilities: [
      {
        id: `${actorId}:ground`,
        family: attackDamage ? "attack" : "produce",
        level: 1,
        domains: ["ground"],
        targetDomains: attackDamage ? ["ground"] : [],
        capacity: { status: "known", value: 0, observedTick: 100 }
      }
    ],
    housingCost: { status: "known", value: relation === "self" ? 1 : 0, observedTick: 100 },
    healthPermille: { status: "known", value: health, observedTick: 100 },
    combatProfile: {
      status: "known",
      observedTick: 100,
      value: {
        maxHealth: 100,
        maxArmour: 0,
        armourPermille: 1000,
        passiveRegenerationPerSecond: 0,
        attacks: attackDamage
          ? [
              {
                damage: attackDamage,
                cooldownTicks: 20,
                range: 5,
                minRange: 0,
                highGroundRangeBonus: 0,
                impactDelayTicks: 0,
                areaRadius: 0,
                targetDomains: ["ground" as const]
              }
            ]
          : [],
        healing: null,
        spells: [],
        statuses: []
      }
    },
    activeOrder: { status: "known", value: null, observedTick: 100 },
    containedInActorId: null
  };
}

function squad(): AiSquadStateV1 {
  return {
    squadId: "squad:attack:pressure",
    role: "attack",
    domain: "ground",
    actorIds: ["guard"],
    objectiveId: "core",
    state: "advance",
    lifecycle: {
      targetPlayerNumber: 2,
      targetRegionId: null,
      protectedBaseId: null,
      rallyNodeId: null,
      retreatNodeId: null,
      createdTick: 0,
      assemblyDeadline: aiDeadline(200),
      effectDeadline: aiDeadline(1200),
      lastUsefulEffectTick: null,
      recoveryAttempt: 0,
      terminalReason: null
    }
  };
}

function state(current: AiSquadStateV1): AiBrainStateV1 {
  const initial = createAiBrainStateV1({
    playerNumber: 1,
    faction: FactionType.Tivara,
    profile,
    tick: 0,
    archetypeId: "balanced"
  });
  return {
    ...initial,
    bases: [
      {
        baseId: "base:home",
        anchorActorId: null,
        memberActorIds: [],
        active: true,
        anchorPosition: { x: 0, y: 0, z: 0 }
      }
    ],
    squads: [current]
  };
}

function observation(tick: number, actors: readonly AiObservedActorV1[]): AiObservationV1 {
  return {
    ...createAiTestObservation(),
    tick,
    actors,
    map: {
      bounds: { status: "known", value: { width: 8, height: 8 }, observedTick: tick },
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
          waterPassable: false,
          elevation: 0,
          observedBlocked: false
        }
      ]
    }
  };
}

describe("AiTacticsManager pressure liveness", () => {
  it("does not fold an air reinforcement into a ground-only attack mission", () => {
    const ground = actor("guard", "self", 1000, 10);
    const air = {
      ...actor("flyer", "self", 1000, 10),
      capabilities: [
        {
          id: "flyer:air",
          family: "attack",
          level: 1,
          domains: ["air" as const],
          targetDomains: ["ground" as const],
          capacity: { status: "known" as const, value: 0, observedTick: 100 }
        }
      ]
    };
    const enemy = actor("core", "enemy", 1000, 0);
    const update = manager.propose(observation(200, [ground, air, enemy]), state(squad())).statePatch
      ?.squadUpdates?.[0];

    expect(update?.actorIds).toEqual(["guard"]);
  });

  it("does not let tactics attack a visible target while strategy is still assembling the mission", () => {
    const friendly = actor("guard", "self", 1000, 10);
    const enemy = actor("core", "enemy", 1000, 0);
    const initial = state({ ...squad(), state: "forming" });
    const waiting = {
      ...initial,
      strategy: {
        ...initial.strategy,
        assessment: {
          choice: "pressure" as const,
          reason: "assembling_against_developed_base",
          targetActorId: enemy.actorId,
          readyForce: 1,
          requiredForce: 8,
          visibleThreatCount: 0,
          confidencePermille: 1000,
          expectedEffectTick: 500,
          reconsiderTick: 240,
          alternatives: []
        }
      }
    };

    const proposal = manager.propose(observation(200, [friendly, enemy]), waiting);
    expect(proposal.statePatch?.squadUpdates?.[0]?.state).toBe("assemble");
    expect(proposal.intents.some((intent) => intent.kind === "attack")).toBe(false);
  });

  it("keeps a visible strategic raid objective instead of replacing it with a higher-scored fortified core", () => {
    const friendly = actor("guard", "self", 1000, 10);
    const raidTarget = actor("economic-site", "enemy", 1000, 0);
    const core = {
      ...actor("core", "enemy", 1000, 0),
      mainBuilding: { status: "known" as const, value: true, observedTick: 100 }
    };
    const mission = { ...squad(), objectiveId: raidTarget.actorId };
    const update = manager.propose(observation(200, [friendly, raidTarget, core]), state(mission)).statePatch
      ?.squadUpdates?.[0];

    expect(update?.objectiveId).toBe(raidTarget.actorId);
    expect(update?.tactics?.targetActorId).toBe(raidTarget.actorId);
  });

  it("engages an immediate armed defender while retaining the strategic objective", () => {
    const friendly = actor("guard", "self", 1000, 10);
    const core = actor("core", "enemy", 1000, 0);
    const defender = { ...actor("defender", "enemy", 1000, 20), logicalPosition: {
      status: "known" as const, value: { x: 2, y: 0, z: 0 }, observedTick: 100
    } };
    const update = manager.propose(observation(200, [friendly, core, defender]), state(squad())).statePatch
      ?.squadUpdates?.[0];

    expect(update?.objectiveId).toBe(core.actorId);
    expect(update?.tactics?.targetActorId).toBe(defender.actorId);
  });

  it("does not retreat indefinitely from a passive core merely because a survivor is wounded", () => {
    const friendly = actor("guard", "self", 200, 10);
    const passiveCore = actor("core", "enemy", 1000, 0);
    const update = manager.propose(observation(200, [friendly, passiveCore]), state(squad())).statePatch
      ?.squadUpdates?.[0];

    expect(update?.state).toBe("engage");
    expect(update?.tactics?.script).not.toBe("protected_retreat");
  });

  it("terminates a no-effect mission at the second deadline even after it briefly leaves recovery", () => {
    const friendly = actor("guard", "self", 1000, 10);
    const passiveCore = actor("core", "enemy", 1000, 0);
    const first = manager.propose(observation(1200, [friendly, passiveCore]), state(squad())).statePatch
      ?.squadUpdates?.[0];
    expect(first?.state).toBe("recover");
    expect(first?.lifecycle?.recoveryAttempt).toBe(1);

    const resumed = manager.propose(observation(1600, [friendly, passiveCore]), state(first!)).statePatch
      ?.squadUpdates?.[0];
    expect(resumed?.state).not.toBe("recover");

    const expired = manager.propose(observation(3600, [friendly, passiveCore]), state(resumed!)).statePatch
      ?.squadUpdates?.[0];
    expect(expired?.state).toBe("completed");
    expect(expired?.lifecycle?.terminalReason).toBe("effect_deadline_exhausted");
  });
});
