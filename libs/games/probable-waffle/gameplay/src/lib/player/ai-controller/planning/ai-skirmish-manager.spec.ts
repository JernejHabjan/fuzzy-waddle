import { FactionType, OrderType } from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiBrainStateV1 } from "../brain/create-ai-brain-state-v1";

import { AI_SKIRMISH_ASSEMBLY_TIMEOUT_TICKS } from "./ai-skirmish-manager";
import { homeNode, enemyNode, unit, observation, profile, manager } from "./ai-skirmish-test-fixtures";

describe("AiSkirmishManager", () => {
  it("asks a reachable question and sends a legal scout instead of treating coverage as success", () => {
    const state = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const proposal = manager.propose(observation(20, [unit("guard-1", homeNode, 0)]), state);

    expect(proposal.intents).toContainEqual(
      expect.objectContaining({ kind: "scout", logicalPosition: { x: 1, y: 0, z: 0 } })
    );
    expect(proposal.statePatch?.knowledge?.questions).toContainEqual(
      expect.objectContaining({ kind: `safe_route:${enemyNode}`, state: "open" })
    );
  });

  it("advances an existing scout to the next uncovered frontier and closes the prior question", () => {
    const state = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const first = manager.propose(observation(20, [unit("guard-1", homeNode, 0)]), state);
    const priorScout = first.statePatch!.squads!.find((squad) => squad.role === "scout")!;
    const continued = manager.propose(
      observation(40, [unit("guard-1", enemyNode, 1)], [enemyNode, homeNode], [enemyNode]),
      {
        ...state,
        knowledge: first.statePatch!.knowledge!,
        squads: [{ ...priorScout, tactics: {} as never }]
      }
    );

    expect(continued.statePatch?.knowledge?.questions).toContainEqual(
      expect.objectContaining({ kind: `safe_route:${enemyNode}`, state: "answered" })
    );
    expect(continued.intents).toContainEqual(
      expect.objectContaining({ kind: "scout", logicalPosition: { x: 0, y: 0, z: 0 } })
    );
    expect(continued.statePatch?.squads?.find((squad) => squad.role === "scout")?.objectiveId).toBe(
      `question:frontier:${homeNode}`
    );
  });

  it("keeps a repeated visible contact as one incident rather than inflating enemy confidence", () => {
    const state = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const enemy = {
      ...unit("enemy-1", enemyNode, 30),
      owner: 2,
      relation: "enemy" as const,
      visibility: "visible" as const
    };
    const first = manager.propose(observation(20, [unit("guard-1", homeNode, 0), enemy]), state);
    const second = manager.propose(observation(40, [unit("guard-1", homeNode, 0), enemy]), {
      ...state,
      skirmish: first.statePatch!.skirmish!
    });

    expect(second.statePatch?.skirmish?.incidents).toHaveLength(1);
    expect(second.statePatch?.skirmish?.incidents[0]).toEqual(
      expect.objectContaining({ confidencePermille: 1000, hostileActorIds: ["enemy-1"] })
    );
    expect(second.statePatch?.skirmish?.timeline.filter((event) => event.kind === "threat")).toHaveLength(1);
  });

  it("retires an old last-seen objective and sends a bounded scout to the next frontier", () => {
    const state = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const staleEnemy = {
      ...unit("stale-enemy", enemyNode, 30),
      owner: 2,
      relation: "enemy" as const,
      visibility: "last_seen" as const,
      observedTick: 0
    };

    const proposal = manager.propose(
      observation(AI_SKIRMISH_ASSEMBLY_TIMEOUT_TICKS + 1, [
        unit("guard-1", homeNode, 0),
        unit("guard-2", homeNode, 0),
        staleEnemy
      ]),
      state
    );

    expect(proposal.statePatch?.squads?.some((squad) => squad.role === "attack")).toBe(false);
    expect(proposal.statePatch?.squads?.find((squad) => squad.role === "scout")?.actorIds).toEqual([
      "guard-1",
      "guard-2"
    ]);
    expect(proposal.intents).toContainEqual(expect.objectContaining({ kind: "scout" }));
  });

  it("anchors local defense to the main building instead of a distant roaming combat unit", () => {
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
    const raider = unit("raider", enemyNode, 30);
    const enemy = {
      ...unit("enemy", enemyNode, 31),
      owner: 2,
      relation: "enemy" as const,
      visibility: "visible" as const
    };

    const proposal = manager.propose(observation(20, [raider, main, enemy]), state);

    expect(proposal.statePatch?.squads?.some((squad) => squad.role === "defense")).toBe(false);
  });

  it("forms a defense squad for a visible raider explicitly ordered against a protected base", () => {
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
    const raider = {
      ...unit("raider", enemyNode, 30),
      owner: 2,
      relation: "enemy" as const,
      visibility: "visible" as const,
      activeOrder: {
        status: "known" as const,
        value: { orderType: OrderType.Attack, targetActorId: main.actorId },
        observedTick: 20
      }
    };

    const proposal = manager.propose(observation(20, [main, guard, raider]), state);

    expect(proposal.statePatch?.squads).toContainEqual(
      expect.objectContaining({ role: "defense", objectiveId: "raider", actorIds: ["guard"] })
    );
  });
});
