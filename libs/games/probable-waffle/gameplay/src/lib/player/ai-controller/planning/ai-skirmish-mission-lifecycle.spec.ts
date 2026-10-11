import { FactionType, ObjectNames, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiBrainStateV1 } from "../brain/create-ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";

import { AI_SKIRMISH_ASSEMBLY_TIMEOUT_TICKS, AiSkirmishManager } from "./ai-skirmish-manager";
import { homeNode, enemyNode, catalog, unit, observation, profile, manager } from "./ai-skirmish-test-fixtures";

describe("AiSkirmishManager", () => {
  it("does not classify a nearby static enemy building as a home raid", () => {
    const state = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const main = {
      ...unit("main", homeNode, 0),
      housingCost: { status: "known" as const, value: 0, observedTick: 0 },
      capabilities: [],
      mainBuilding: { status: "known" as const, value: true, observedTick: 0 }
    };
    const guard = unit("guard", homeNode, 0);
    const enemyBuilding = {
      ...unit("enemy-building", enemyNode, 5),
      owner: 2,
      relation: "enemy" as const,
      visibility: "visible" as const,
      housingCost: { status: "known" as const, value: 0, observedTick: 0 },
      capabilities: []
    };

    const proposal = manager.propose(observation(20, [main, guard, enemyBuilding]), state);

    expect(proposal.statePatch?.squads?.some((candidate) => candidate.role === "defense")).toBe(false);
    expect(proposal.statePatch?.strategy?.stance).toBe("pressure");
  });

  it("keeps armed gatherers out of standing attack and scout squads", () => {
    const workerCatalog: AiCapabilityCatalogV1 = {
      ...catalog,
      entries: [
        ...catalog.entries,
        {
          ...catalog.entries[0]!,
          capabilityId: "worker",
          sourceObjectName: ObjectNames.TivaraWorker,
          gathers: [ResourceType.Wood]
        }
      ]
    };
    const workerManager = new AiSkirmishManager(profile, () => workerCatalog);
    const initial = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const worker = { ...unit("worker", homeNode, 0), objectName: ObjectNames.TivaraWorker };
    const enemy = {
      ...unit("enemy", enemyNode, 1),
      owner: 2,
      relation: "enemy" as const,
      visibility: "visible" as const
    };
    const proposal = workerManager.propose(observation(20, [worker, enemy]), initial);

    expect(proposal.statePatch?.squads).toEqual([]);
    expect(proposal.intents.some((intent) => "actorIds" in intent && intent.actorIds.includes("worker"))).toBe(false);
    expect(proposal.reasons).toContain("combat:0");
  });

  it("launches a bounded smaller mission after an impossible full assembly wait", () => {
    const initial = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const enemy = {
      ...unit("enemy-1", enemyNode, 30),
      objectName: ObjectNames.TivaraWorker,
      capabilities: [],
      owner: 2,
      relation: "enemy" as const,
      visibility: "visible" as const
    };
    const state = {
      ...initial,
      squads: [
        {
          squadId: "squad:attack:primary" as const,
          role: "attack" as const,
          domain: "ground" as const,
          actorIds: ["guard-1"],
          objectiveId: "enemy-1",
          state: "forming" as const,
          lifecycle: {
            targetPlayerNumber: 2,
            targetRegionId: enemyNode,
            protectedBaseId: null,
            rallyNodeId: homeNode,
            retreatNodeId: homeNode,
            createdTick: 0,
            assemblyDeadline: {
              clock: "simulation" as const,
              unit: "tick" as const,
              persistence: "save" as const,
              dueTick: AI_SKIRMISH_ASSEMBLY_TIMEOUT_TICKS
            },
            effectDeadline: {
              clock: "simulation" as const,
              unit: "tick" as const,
              persistence: "save" as const,
              dueTick: 2400
            },
            lastUsefulEffectTick: null,
            recoveryAttempt: 0,
            terminalReason: null
          }
        }
      ]
    };
    const proposal = manager.propose(
      observation(AI_SKIRMISH_ASSEMBLY_TIMEOUT_TICKS, [unit("guard-1", homeNode, 0), enemy]),
      state
    );

    expect(proposal.intents).toContainEqual(
      expect.objectContaining({ kind: "attack", actorIds: ["guard-1"], targetActorId: "enemy-1" })
    );
    const defended = manager.propose(
      observation(AI_SKIRMISH_ASSEMBLY_TIMEOUT_TICKS, [
        unit("guard-1", homeNode, 0),
        {
          ...enemy,
          objectName: ObjectNames.TivaraMacemanMale,
          capabilities: unit("defender", enemyNode, 30).capabilities
        }
      ]),
      state
    );
    expect(defended.intents.some((intent) => intent.kind === "attack")).toBe(false);
    expect(proposal.statePatch?.squads?.find((squad) => squad.role === "attack")?.state).toBe("moving");
    expect(proposal.statePatch?.skirmish?.timeline).toContainEqual(
      expect.objectContaining({ subjectId: "squad:attack:primary", detail: "launch:direct" })
    );

    const repeated = manager.propose(
      observation(AI_SKIRMISH_ASSEMBLY_TIMEOUT_TICKS + 20, [unit("guard-1", homeNode, 0), enemy]),
      {
        ...state,
        skirmish: proposal.statePatch!.skirmish!,
        squads: proposal.statePatch!.squads!
      }
    );
    expect(repeated.intents.some((intent) => intent.kind === "attack")).toBe(false);
    expect(repeated.statePatch?.skirmish?.timeline.filter((event) => event.detail.startsWith("launch:"))).toHaveLength(
      1
    );
  });
});
