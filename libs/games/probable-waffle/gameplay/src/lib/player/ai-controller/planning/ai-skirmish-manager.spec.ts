import { FactionType, OrderType } from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiBrainStateV1 } from "../brain/create-ai-brain-state-v1";
import { createAiTestOwnedActor } from "../testing/ai-test-fixtures";

import { AI_SKIRMISH_ASSEMBLY_TIMEOUT_TICKS } from "./ai-skirmish-manager";
import { homeNode, enemyNode, unit, observation, profile, manager } from "./ai-skirmish-test-fixtures";
import { nextQuestion } from "./ai-skirmish-support";

describe("AiSkirmishManager", () => {
  it("keeps the home building threat ahead of a separate worker-side threat", () => {
    const state = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const home = {
      ...unit("home", homeNode, 0),
      mainBuilding: { status: "known" as const, value: true, observedTick: 20 }
    };
    const worker = {
      ...createAiTestOwnedActor("worker"),
      logicalPosition: { status: "known" as const, value: { x: 10, y: 10, z: 0 }, observedTick: 20 },
      capabilities: [{
        id: "worker:gather",
        family: "gather",
        level: 1,
        domains: ["ground" as const],
        targetDomains: [],
        capacity: { status: "known" as const, value: 1, observedTick: 20 }
      }]
    };
    const homeRaider = {
      ...unit("z-home-raider", enemyNode, 1),
      owner: 2,
      relation: "enemy" as const,
      visibility: "visible" as const
    };
    const workerRaider = {
      ...unit("a-worker-raider", enemyNode, 11),
      owner: 2,
      relation: "enemy" as const,
      visibility: "visible" as const,
      logicalPosition: { status: "known" as const, value: { x: 10, y: 11, z: 0 }, observedTick: 20 }
    };
    const input = observation(20, [home, worker, homeRaider, workerRaider]);
    const proposal = manager.propose({
      ...input,
      threatSummary: {
        ...input.threatSummary,
        visibleEnemyActorIds: [homeRaider.actorId, workerRaider.actorId]
      }
    }, state);

    expect(proposal.intents).toContainEqual(expect.objectContaining({
      kind: "attack",
      targetActorId: homeRaider.actorId
    }));
    expect(proposal.intents).not.toContainEqual(expect.objectContaining({
      kind: "attack",
      targetActorId: workerRaider.actorId
    }));
  });

  it("releases a vanished defensive objective instead of freezing the next economy in defend", () => {
    const state = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const defended = { ...state, strategy: { ...state.strategy, stance: "defend" as const, objectiveId: "gone" } };
    const proposal = manager.propose(observation(2000, [unit("guard", homeNode, 0)]), defended);
    expect(proposal.statePatch?.strategy).toMatchObject({ stance: "stabilize", objectiveId: null, goalId: null });
    expect(proposal.intents.some((intent) => intent.kind === "scout")).toBe(true);
  });
  it("SCOUT-02/H-22 does not send scouts back to an answered frontier after its units leave", () => {
    const input = observation(2000, [unit("guard", homeNode, 0)], [enemyNode], []);
    const knowledge = {
      revision: 1,
      evidence: [],
      questions: [
        {
          questionId: `question:frontier:${enemyNode}` as const,
          kind: `safe_route:${enemyNode}`,
          createdTick: 20,
          state: "answered" as const
        }
      ]
    };
    expect(nextQuestion(input, knowledge)).toBeUndefined();
    const next = nextQuestion(
      { ...input, map: { ...input.map!, frontierAccessNodeIds: [enemyNode, homeNode] } },
      knowledge
    );
    expect(next?.kind).toBe(`safe_route:${homeNode}`);
    expect(next?.state).toBe("open");
  });
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
    expect(proposal.evaluatedLanes).toContain("scouting");
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
    expect(proposal.statePatch?.squads?.find((squad) => squad.role === "scout")?.actorIds).toEqual(["guard-1"]);
    expect(proposal.intents).toContainEqual(expect.objectContaining({ kind: "scout" }));
  });

  it("keeps a question scout separate from the force assigned to a visible contact", () => {
    const state = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const enemy = {
      ...unit("enemy-visible", enemyNode, 1),
      owner: 2,
      relation: "enemy" as const,
      visibility: "visible" as const
    };
    const proposal = manager.propose(
      observation(20, [
        unit("guard-1", homeNode, 0),
        unit("guard-2", homeNode, 0),
        unit("guard-3", homeNode, 0),
        enemy
      ]),
      state
    );
    const squads = proposal.statePatch?.squads ?? [];
    const scout = squads.find((squad) => squad.role === "scout");
    const attack = squads.filter((squad) => squad.role === "attack").flatMap((squad) => squad.actorIds);

    expect(proposal.intents).toContainEqual(expect.objectContaining({ kind: "scout" }));
    expect(scout?.actorIds).toHaveLength(1);
    expect(attack).not.toContain(scout?.actorIds[0]);
    expect(new Set([...attack, ...(scout?.actorIds ?? [])]).size).toBe(attack.length + (scout?.actorIds.length ?? 0));
  });

  it("preserves an active question scout when another defender can cover the local threat", () => {
    const state = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const scoutId = `question:frontier:${enemyNode}`;
    const enemy = {
      ...unit("enemy-visible", enemyNode, 1),
      owner: 2,
      relation: "enemy" as const,
      visibility: "visible" as const
    };
    const proposal = manager.propose(
      observation(40, [unit("scout-guard", homeNode, 0), unit("home-guard", homeNode, 0), enemy]),
      {
        ...state,
        squads: [
          {
            squadId: "squad:scout:primary",
            role: "scout",
            domain: "ground",
            actorIds: ["scout-guard"],
            objectiveId: scoutId,
            state: "moving"
          }
        ]
      }
    );
    const scout = proposal.statePatch?.squads?.find((squad) => squad.role === "scout" && squad.objectiveId === scoutId);
    const defense = proposal.statePatch?.squads?.find((squad) => squad.role === "defense");

    expect(scout?.actorIds).toEqual(["scout-guard"]);
    expect(defense?.actorIds).toContain("home-guard");
    expect(defense?.actorIds).not.toContain("scout-guard");
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
