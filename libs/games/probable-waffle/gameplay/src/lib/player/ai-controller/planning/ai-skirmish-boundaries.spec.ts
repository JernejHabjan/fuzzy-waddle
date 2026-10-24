import { FactionType } from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiBrainStateV1 } from "../brain/create-ai-brain-state-v1";

import { AI_CONCESSION_HOPELESS_TICKS } from "./ai-skirmish-manager";
import { homeNode, enemyNode, unit, observation, profile, manager } from "./ai-skirmish-test-fixtures";

describe("AiSkirmishManager", () => {
  it("keeps the chosen opponent focus and does not recall a defender for a distant bait contact", () => {
    const initial = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const focused = {
      ...unit("enemy-focus", enemyNode, 30),
      owner: 2,
      relation: "enemy" as const,
      visibility: "visible" as const
    };
    const bait = {
      ...unit("enemy-bait", enemyNode, 200),
      owner: 3,
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
          objectiveId: "enemy-focus",
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
              dueTick: 1200
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
    const proposal = manager.propose(observation(20, [unit("guard-1", homeNode, 0), bait, focused]), state);

    expect(proposal.statePatch?.squads?.find((squad) => squad.role === "attack")?.objectiveId).toBe("enemy-focus");
    expect(proposal.statePatch?.squads?.some((squad) => squad.role === "defense")).toBe(false);
  });

  it("requires sustained hopelessness, then emits exactly one authoritative concession intent", () => {
    const initial = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const state = {
      ...initial,
      skirmish: {
        ...initial.skirmish,
        mode: { ...initial.skirmish.mode, state: "hopeless" as const, hopelessSinceTick: 0 }
      }
    };
    const proposal = manager.propose(observation(AI_CONCESSION_HOPELESS_TICKS, [], []), state);

    expect(proposal.intents).toContainEqual(
      expect.objectContaining({ kind: "concede", reason: "sustained_no_recoverable_route" })
    );
    expect(proposal.statePatch?.skirmish?.mode.concessionIntentId).toEqual(expect.any(String));
  });
});
