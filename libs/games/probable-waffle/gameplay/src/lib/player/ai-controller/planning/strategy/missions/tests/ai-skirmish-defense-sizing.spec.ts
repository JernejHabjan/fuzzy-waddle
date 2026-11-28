import {
  FactionType,
  ObjectNames,
  OrderType,
  ProbableWaffleAiDifficulty
} from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiBrainState } from "../../../../brain/state/create-ai-brain-state";
import type { AiCapabilityCatalog } from "../../../../contracts/observation/ai-capability-catalog";
import type { AiObservedActor } from "../../../../contracts/observation/ai-observation";
import type { AiSkirmishProposalContext } from "../ai-skirmish-proposal-context";
import { createAiProfileConfig } from "../../../../profiles/ai-profile-defaults";
import {
  createAiTestObservation,
  createAiTestOwnedActor
} from "../../../../testing/fixtures/coordination/ai-test-fixtures";
import { buildAiAccessGraph } from "../../../access/ai-access-graph";
import { advanceAiExpansionSecurity, advanceAiSkirmishDefense } from "../ai-skirmish-defense";
import { createAiSkirmishProposalContext } from "../ai-skirmish-proposal-draft";
import { finalizeAiSkirmishProposal } from "../ai-skirmish-finalizer";

const profile = createAiProfileConfig(ProbableWaffleAiDifficulty.Medium);
const catalog: AiCapabilityCatalog = { schemaVersion: 1, generation: 1, entries: [], unsupported: [] };

function combatant(
  id: string,
  relation: "self" | "enemy",
  x: number,
  visibleEnemyActorIds?: AiObservedActor["visibleEnemyActorIds"]
): AiObservedActor {
  return {
    ...createAiTestOwnedActor(id),
    objectName: ObjectNames.TivaraMacemanMale,
    owner: relation === "self" ? 1 : 2,
    relation,
    visibility: relation === "self" ? "owned" : "visible",
    ...(visibleEnemyActorIds ? { visibleEnemyActorIds } : {}),
    logicalPosition: { status: "known", value: { x, y: 0, z: 0 }, observedTick: 20 },
    capabilities: [
      {
        id: `${id}:attack`,
        family: "attack",
        level: 1,
        domains: ["ground"],
        targetDomains: ["ground"],
        capacity: { status: "known", value: 0, observedTick: 20 }
      }
    ],
    housingCost: { status: "known", value: 1, observedTick: 20 }
  };
}

function defenseContextFor(
  raiderCount: number,
  distantFirstDefender = false,
  exactEmptyVision = false,
  defenderCount = 8,
  harmlessContact = false
): AiSkirmishProposalContext {
  const home: AiObservedActor = {
    ...createAiTestOwnedActor("main"),
    objectName: ObjectNames.Sandhold,
    mainBuilding: { status: "known", value: true, observedTick: 20 },
    housingCost: { status: "known", value: 0, observedTick: 20 },
    logicalPosition: { status: "known", value: { x: 0, y: 0, z: 0 }, observedTick: 20 }
  };
  const defenders = Array.from({ length: defenderCount }, (_, index) =>
    combatant(`guard-${index}`, "self", distantFirstDefender && index === 0 ? 20 : 1, exactEmptyVision ? [] : undefined)
  );
  const raiders = Array.from({ length: raiderCount }, (_, index) => {
    const actor = combatant(`raider-${index}`, "enemy", 3 + index);
    return harmlessContact
      ? {
          ...actor,
          capabilities: [],
          combatProfile: {
            status: "known" as const,
            observedTick: 20,
            value: {
              attacks: [],
              maxHealth: 100,
              maxArmour: 0,
              armourPermille: 0,
              passiveRegenerationPerSecond: 0,
              healing: null,
              spells: [],
              statuses: []
            }
          }
        }
      : actor;
  });
  const observation = { ...createAiTestObservation(), actors: [home, ...defenders, ...raiders] };
  const state = createAiBrainState({
    playerNumber: 1,
    faction: FactionType.Tivara,
    profile,
    tick: 0,
    archetypeId: "balanced"
  });
  const context = createAiSkirmishProposalContext(observation, state, catalog);
  advanceAiSkirmishDefense(context, profile);
  return context;
}

function defendersFor(raiderCount: number): number {
  const context = defenseContextFor(raiderCount);
  return context.nextSquads.find((squad) => squad.role === "defense")?.actorIds.length ?? 0;
}

describe("AI local defense sizing", () => {
  it("releases a persistent expansion guard when its site or safe route is no longer available", () => {
    const baseState = createAiBrainState({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 20,
      archetypeId: "balanced"
    });
    const priorGuard = {
      squadId: "squad:escort:expansion:base:expansion:remote" as const,
      role: "escort" as const,
      domain: "ground" as const,
      actorIds: ["former-guard"],
      objectiveId: "expansion-guard:base:expansion:remote",
      state: "defend" as const
    };
    const state = { ...baseState, squads: [priorGuard] };
    const context = createAiSkirmishProposalContext(createAiTestObservation(), state, catalog);

    advanceAiExpansionSecurity(context);
    const proposal = finalizeAiSkirmishProposal(context);

    expect(proposal.statePatch?.squads).toContainEqual(
      expect.objectContaining({
        squadId: priorGuard.squadId,
        actorIds: [],
        state: "completed"
      })
    );
  });

  it("stations one reachable guard at a developed expansion when army size permits", () => {
    const graph = buildAiAccessGraph({
      generation: 1,
      staticRevision: 1,
      dynamicRevision: 1,
      threatRevision: 0,
      builtTick: 20,
      continuationCursor: 0,
      includeAirRegion: true,
      cells: [0, 1, 2, 3, 4].map((x) => ({
        x,
        y: 0,
        ground: true,
        water: false,
        elevation: 0,
        groundNeighborKeys: [x > 0 ? `${x - 1},0` : "1,0", x < 4 ? `${x + 1},0` : "3,0"],
        knowledge: "known_static" as const,
        clearance: 2
      }))
    });
    const homeNode = graph.groundNodeByTileKey.get("0,0")!;
    const expansionNode = graph.groundNodeByTileKey.get("4,0")!;
    const home = {
      ...createAiTestOwnedActor("main"),
      objectName: ObjectNames.Sandhold,
      mainBuilding: { status: "known" as const, value: true, observedTick: 20 }
    };
    const guards = Array.from({ length: 8 }, (_, index) => ({
      ...combatant(`expansion-guard-${index}`, "self", 0),
      accessNodeId: { status: "known" as const, value: homeNode, observedTick: 20 }
    }));
    const baseObservation = createAiTestObservation();
    const observation = {
      ...baseObservation,
      actors: [home, ...guards],
      map: {
        bounds: { status: "known" as const, value: { width: 5, height: 1 }, observedTick: 20 },
        staticRevision: 1,
        frontierAccessNodeIds: [],
        scoutCoverageAccessNodeIds: [],
        scoutSearchPoints: [],
        dynamicObstacleActorIds: [],
        regionGeneration: { generation: 1, status: "ready" as const, continuationCursor: 0 },
        accessGraph: graph.graph,
        tacticalCells: [
          {
            tileKey: "3,0",
            position: { x: 3, y: 0, z: 0 },
            groundPassable: true,
            waterPassable: false,
            elevation: 0,
            observedBlocked: false,
            groundAccessNodeId: expansionNode
          }
        ]
      }
    };
    const state = {
      ...createAiBrainState({
        playerNumber: 1,
        faction: FactionType.Tivara,
        profile,
        tick: 20,
        archetypeId: "balanced"
      }),
      bases: [
        {
          baseId: "base:main:main" as const,
          anchorActorId: home.actorId,
          memberActorIds: [],
          active: true,
          accessNodeId: homeNode,
          anchorPosition: { x: 0, y: 0, z: 0 }
        },
        {
          baseId: "base:expansion:remote" as const,
          anchorActorId: "expansion-structure" as const,
          memberActorIds: [],
          active: true,
          accessNodeId: expansionNode,
          anchorPosition: { x: 4, y: 0, z: 0 }
        }
      ]
    };
    const context = createAiSkirmishProposalContext(observation, state, catalog);
    const securityContext = {
      ...context,
      homeBaseActor: home,
      primaryOwnedActors: new Set(context.primaryOwnedActors)
    };

    advanceAiExpansionSecurity(securityContext);

    expect(securityContext.nextSquads).toContainEqual(
      expect.objectContaining({
        squadId: "squad:escort:expansion:base:expansion:remote",
        role: "escort",
        actorIds: ["expansion-guard-0"],
        objectiveId: "expansion-guard:base:expansion:remote",
        state: "moving"
      })
    );
    expect(securityContext.intents).toContainEqual(
      expect.objectContaining({ kind: "move", actorIds: ["expansion-guard-0"], logicalPosition: { x: 3, y: 0, z: 0 } })
    );
    expect(securityContext.primaryOwnedActors.has("expansion-guard-0")).toBe(true);
  });

  it("uses a bounded three-unit response against one mobile home raider", () => expect(defendersFor(1)).toBe(3));

  it("keeps an active attack force together against a forward tower while leaving reserves for defense", () => {
    const original = defenseContextFor(1, false, false, 8);
    const tower = {
      ...combatant("forward-tower", "enemy", 7),
      housingCost: { status: "unknown" as const, reason: "not_supported" as const }
    };
    const attack = {
      squadId: "squad:attack:primary" as const,
      role: "attack" as const,
      domain: "ground" as const,
      actorIds: ["guard-0", "guard-1", "guard-2", "guard-3"],
      objectiveId: "enemy-workmill" as const,
      state: "moving" as const
    };
    const context: AiSkirmishProposalContext = {
      ...original,
      observation: {
        ...original.observation,
        actors: [...original.observation.actors.filter((actor) => actor.relation === "self"), tower]
      },
      visibleEnemies: [tower],
      localThreat: tower,
      activeAttack: attack,
      state: { ...original.state, squads: [attack] },
      intents: [],
      nextSquads: [],
      primaryOwnedActors: new Set()
    };

    advanceAiSkirmishDefense(context, profile);

    const defense = context.nextSquads.find((squad) => squad.role === "defense");
    expect(defense?.actorIds).not.toEqual(expect.arrayContaining(attack.actorIds));
    expect(defense?.actorIds.length).toBeGreaterThan(0);
  });

  it("can recruit an active attack force when the visible mobile threat is near home", () => {
    const original = defenseContextFor(1, false, false, 8);
    const attack = {
      squadId: "squad:attack:primary" as const,
      role: "attack" as const,
      domain: "ground" as const,
      actorIds: ["guard-0", "guard-1", "guard-2", "guard-3"],
      objectiveId: "enemy-workmill" as const,
      state: "moving" as const
    };
    const context: AiSkirmishProposalContext = {
      ...original,
      activeAttack: attack,
      state: { ...original.state, squads: [attack] },
      intents: [],
      nextSquads: [],
      primaryOwnedActors: new Set()
    };

    advanceAiSkirmishDefense(context, profile);

    const defense = context.nextSquads.find((squad) => squad.role === "defense");
    expect(defense?.actorIds).toEqual(expect.arrayContaining(["guard-0", "guard-1"]));
  });

  it.each(["engage", "retreat"] as const)(
    "does not interrupt a %s fallback when other defenders are available",
    (mode) => {
      const original = defenseContextFor(1, false, false, 4);
      const withdrawing = {
        ...original.combat[0]!,
        activeOrder: {
          status: "known" as const,
          observedTick: 20,
          value: { orderType: OrderType.Move, targetActorId: null, targetPosition: { x: 20, y: 0, z: 0 } }
        }
      };
      const prior = {
        squadId: "squad:attack:primary",
        role: "attack",
        domain: "ground",
        state: mode,
        actorIds: [withdrawing.actorId],
        objectiveId: "enemy",
        tactics: {
          script: mode === "retreat" ? "protected_retreat" : "engage",
          individualFallbackActorIds: mode === "engage" ? [withdrawing.actorId] : []
        }
      } as unknown as ReturnType<typeof createAiBrainState>["squads"][number];
      const context: AiSkirmishProposalContext = {
        ...original,
        combat: [withdrawing, ...original.combat.slice(1)],
        state: { ...original.state, squads: [prior] },
        intents: [],
        nextSquads: [],
        primaryOwnedActors: new Set()
      };

      advanceAiSkirmishDefense(context, profile);

      expect(context.nextSquads.find((squad) => squad.role === "defense")?.actorIds).not.toContain(withdrawing.actorId);
      expect(context.nextSquads.find((squad) => squad.role === "defense")?.actorIds.length).toBeGreaterThan(0);
    }
  );

  it("recalls a healthy withdrawing defender before critically wounded ones", () => {
    const original = defenseContextFor(1, false, false, 2);
    const combat = original.combat.map((actor, index) => ({
      ...actor,
      healthPermille: { status: "known" as const, observedTick: 20, value: index === 0 ? 180 : 1000 },
      activeOrder: {
        status: "known" as const,
        observedTick: 20,
        value: { orderType: OrderType.Move, targetActorId: null, targetPosition: { x: 20, y: 0, z: 0 } }
      }
    }));
    const prior = {
      squadId: "squad:attack:primary",
      role: "attack",
      domain: "ground",
      state: "retreat",
      actorIds: combat.map((actor) => actor.actorId),
      objectiveId: "enemy",
      tactics: { script: "protected_retreat", individualFallbackActorIds: [] }
    } as unknown as ReturnType<typeof createAiBrainState>["squads"][number];
    const context: AiSkirmishProposalContext = {
      ...original,
      combat,
      state: { ...original.state, squads: [prior] },
      intents: [],
      nextSquads: [],
      primaryOwnedActors: new Set()
    };

    advanceAiSkirmishDefense(context, profile);

    expect(context.nextSquads.find((squad) => squad.role === "defense")?.actorIds).toEqual([combat[1]!.actorId]);
  });

  it("keeps a neutral scout reserved until its protected retreat has completed", () => {
    const original = defenseContextFor(1, false, false, 4),
      scoutActor = original.combat[0]!;
    const context: AiSkirmishProposalContext = {
      ...original,
      state: {
        ...original.state,
        squads: [
          {
            squadId: "squad:scout:neutral",
            role: "scout",
            domain: "air",
            actorIds: [scoutActor.actorId],
            objectiveId: "neutral:deposit",
            state: "retreat"
          }
        ]
      },
      activeScout: {
        squadId: "squad:scout:primary",
        role: "scout",
        domain: "ground",
        actorIds: [original.combat[1]!.actorId],
        objectiveId: "question:search",
        state: "advance"
      },
      intents: [],
      nextSquads: [],
      primaryOwnedActors: new Set()
    };

    advanceAiSkirmishDefense(context, profile);

    const defense = context.nextSquads.find((squad) => squad.role === "defense");
    expect(defense?.actorIds).not.toContain(scoutActor.actorId);
  });

  it("releases a scout from a terminal scouting mission for home defense", () => {
    const original = defenseContextFor(1, false, false, 4),
      scoutActor = original.combat[0]!;
    const context: AiSkirmishProposalContext = {
      ...original,
      state: {
        ...original.state,
        squads: [
          {
            squadId: "squad:scout:completed-question",
            role: "scout",
            domain: "ground",
            actorIds: [scoutActor.actorId],
            objectiveId: "question:search",
            state: "completed"
          }
        ]
      },
      activeScout: undefined,
      intents: [],
      nextSquads: [],
      primaryOwnedActors: new Set()
    };

    advanceAiSkirmishDefense(context, profile);

    const defense = context.nextSquads.find((squad) => squad.role === "defense");
    expect(defense?.actorIds).toContain(scoutActor.actorId);
  });

  it("keeps most of a large army available when a harmless mobile contact approaches home", () => {
    const context = defenseContextFor(1, false, false, 12, true);
    const defenders = context.nextSquads.find((squad) => squad.role === "defense")?.actorIds ?? [];
    expect(defenders.length).toBeGreaterThan(0);
    expect(defenders.length).toBeLessThan(12);
    expect(context.primaryOwnedActors.size).toBe(defenders.length);
  });

  it("scales defense to visible multi-unit home pressure instead of recalling only a quarter of the army", () =>
    expect(defendersFor(3)).toBe(8));

  it("splits the recruited defense across simultaneous armed threats", () => {
    const context = defenseContextFor(3),
      attacks = context.intents.filter((intent) => intent.kind === "attack");
    expect(new Set(attacks.map((intent) => (intent.kind === "attack" ? intent.targetActorId : ""))).size).toBe(3);
    expect(attacks.reduce((count, intent) => count + (intent.kind === "attack" ? intent.actorIds.length : 0), 0)).toBe(
      8
    );
  });

  it("prioritizes an enemy beside a threatened service over a closer-to-home raider", () => {
    const home: AiObservedActor = {
      ...createAiTestOwnedActor("main"),
      mainBuilding: { status: "known", value: true, observedTick: 20 },
      logicalPosition: { status: "known", value: { x: 32, y: 18, z: 0 }, observedTick: 20 }
    };
    const service: AiObservedActor = {
      ...createAiTestOwnedActor("deposit"),
      capabilities: [
        {
          id: "deposit:dropoff",
          family: "drop_off",
          level: 1,
          domains: [],
          targetDomains: [],
          capacity: { status: "known", value: 0, observedTick: 20 }
        }
      ],
      logicalPosition: { status: "known", value: { x: 32, y: 30, z: 0 }, observedTick: 20 }
    };
    const bait = {
      ...combatant("bait", "enemy", 38),
      logicalPosition: { status: "known" as const, value: { x: 38, y: 18, z: 0 }, observedTick: 20 }
    };
    const serviceRaider = {
      ...combatant("service-raider", "enemy", 31),
      logicalPosition: { status: "known" as const, value: { x: 31, y: 28, z: 0 }, observedTick: 20 }
    };
    const baseObservation = createAiTestObservation();
    const observation = {
      ...baseObservation,
      threatSummary: { ...baseObservation.threatSummary, visibleEnemyActorIds: [bait.actorId, serviceRaider.actorId] },
      actors: [home, service, combatant("guard-0", "self", 32), bait, serviceRaider]
    };
    const state = createAiBrainState({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 20,
      archetypeId: "balanced"
    });

    expect(createAiSkirmishProposalContext(observation, state, catalog).localThreat?.actorId).toBe("service-raider");
  });

  it("retains the active defense target while another raider moves closer to the service", () => {
    const home: AiObservedActor = {
      ...createAiTestOwnedActor("main"),
      mainBuilding: { status: "known", value: true, observedTick: 20 },
      logicalPosition: { status: "known", value: { x: 32, y: 18, z: 0 }, observedTick: 20 }
    };
    const service: AiObservedActor = {
      ...createAiTestOwnedActor("deposit"),
      capabilities: [
        {
          id: "deposit:dropoff",
          family: "drop_off",
          level: 1,
          domains: [],
          targetDomains: [],
          capacity: { status: "known", value: 0, observedTick: 20 }
        }
      ],
      logicalPosition: { status: "known", value: { x: 32, y: 30, z: 0 }, observedTick: 20 }
    };
    const committedRaider = {
      ...combatant("committed-raider", "enemy", 31),
      logicalPosition: { status: "known" as const, value: { x: 31, y: 28, z: 0 }, observedTick: 20 }
    };
    const closerRaider = {
      ...combatant("closer-raider", "enemy", 32),
      logicalPosition: { status: "known" as const, value: { x: 32, y: 30, z: 0 }, observedTick: 20 }
    };
    const baseObservation = createAiTestObservation();
    const observation = {
      ...baseObservation,
      threatSummary: {
        ...baseObservation.threatSummary,
        visibleEnemyActorIds: [committedRaider.actorId, closerRaider.actorId]
      },
      actors: [home, service, combatant("guard-0", "self", 32), committedRaider, closerRaider]
    };
    const initialState = createAiBrainState({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 20,
      archetypeId: "balanced"
    });
    const state = {
      ...initialState,
      squads: [
        {
          squadId: "squad:defense:home" as const,
          role: "defense" as const,
          domain: "ground" as const,
          actorIds: ["guard-0"],
          objectiveId: committedRaider.actorId,
          state: "engaged" as const
        }
      ]
    };

    expect(createAiSkirmishProposalContext(observation, state, catalog).localThreat?.actorId).toBe(
      committedRaider.actorId
    );
  });

  it("claims every defender so a retreat order cannot overlap the attack command", () => {
    const context = defenseContextFor(1);
    const attack = context.intents.find((intent) => intent.kind === "attack");

    expect(attack?.kind).toBe("attack");
    if (attack?.kind !== "attack") return;
    expect(attack.claims).toEqual(
      attack.actorIds.map((actorId) => ({
        claimId: `claim:stage9:actor:${actorId}`,
        kind: "actor",
        actorId
      }))
    );
  });

  it("preserves an active target while assigning other defenders to a closer raider", () => {
    const original = defenseContextFor(3);
    const defendedTarget = original.visibleEnemies[0]!;
    const newlyCloserTarget = original.visibleEnemies[2]!;
    const engagedDefender = original.combat[0]!;
    const engagedCombat = original.combat.map((actor) =>
      actor.actorId === engagedDefender.actorId
        ? {
            ...actor,
            activeOrder: {
              status: "known" as const,
              observedTick: 20,
              value: { orderType: OrderType.Attack, targetActorId: defendedTarget.actorId }
            }
          }
        : actor
    );
    const context: AiSkirmishProposalContext = {
      ...original,
      combat: engagedCombat,
      localThreat: newlyCloserTarget,
      activeDefense: {
        squadId: "squad:defense:home",
        role: "defense",
        domain: "ground",
        actorIds: ["guard-0"],
        objectiveId: defendedTarget.actorId,
        state: "engaged"
      },
      intents: [],
      nextSquads: [],
      primaryOwnedActors: new Set()
    };

    advanceAiSkirmishDefense(context, profile);

    expect(context.nextSquads[0]?.objectiveId).toBe(newlyCloserTarget.actorId);
    expect(context.intents.find((intent) => intent.kind === "attack")).toMatchObject({
      targetActorId: newlyCloserTarget.actorId,
      actorIds: expect.not.arrayContaining([engagedDefender.actorId])
    });
  });

  it("does not reissue an identical attack order and cancel its weapon windup", () => {
    const original = defenseContextFor(1);
    const target = original.localThreat!;
    const currentDefender = original.combat[0]!;
    const defender = {
      ...currentDefender,
      activeOrder: {
        status: "known" as const,
        observedTick: 20,
        value: { orderType: OrderType.Attack, targetActorId: target.actorId }
      }
    };
    const context: AiSkirmishProposalContext = {
      ...original,
      combat: original.combat.map((actor) => (actor.actorId === defender.actorId ? defender : actor)),
      intents: [],
      nextSquads: [],
      primaryOwnedActors: new Set()
    };

    advanceAiSkirmishDefense(context, profile);

    expect(
      context.intents.filter((intent) => intent.kind === "attack").flatMap((intent) => intent.actorIds)
    ).not.toContain(defender.actorId);
  });

  it("recalls a defender attacking a visible target far from home", () => {
    const original = defenseContextFor(1);
    const distantEnemy = combatant("distant-enemy", "enemy", 30);
    const context: AiSkirmishProposalContext = {
      ...original,
      visibleEnemies: [...original.visibleEnemies, distantEnemy],
      combat: original.combat.map((actor, index) =>
        index === 0
          ? {
              ...actor,
              activeOrder: {
                status: "known",
                observedTick: 20,
                value: { orderType: OrderType.Attack, targetActorId: distantEnemy.actorId }
              }
            }
          : actor
      ),
      intents: [],
      nextSquads: [],
      primaryOwnedActors: new Set()
    };
    advanceAiSkirmishDefense(context, profile);
    expect(context.intents.find((intent) => intent.kind === "attack")).toMatchObject({
      targetActorId: original.localThreat?.actorId,
      actorIds: expect.arrayContaining(["guard-0"])
    });
  });

  it("moves a distant defender to sight while retaining the nearby force needed for a safe attack", () => {
    const context = defenseContextFor(1, true, false, 2);
    const attack = context.intents.find((intent) => intent.kind === "attack");
    const intercept = context.intents.find((intent) => intent.kind === "move");

    expect(attack && "actorIds" in attack ? attack.actorIds : []).toEqual(["guard-1"]);
    expect(intercept && "actorIds" in intercept ? intercept.actorIds : []).toEqual(["guard-0"]);
  });

  it("does not attack a player-visible threat absent from each defender's native vision", () => {
    const context = defenseContextFor(1, false, true);

    expect(context.intents.some((intent) => intent.kind === "attack")).toBe(false);
    expect(context.intents).toContainEqual(
      expect.objectContaining({ kind: "move", actorIds: ["guard-0", "guard-1", "guard-2"] })
    );
  });
});
