import type { ActorId } from "@fuzzy-waddle/platform-game-sessions";
import { ObjectNames, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import { aiDeadline } from "../contracts/ai-core-types";
import { arbitrateAiIntents } from "../brain/ai-intent-arbiter";
import { AiFortificationManager } from "./ai-fortification-manager";
import { profile, catalog, actor, observation, threatenedState } from "./ai-fortification-test-fixture";

describe("AiFortificationManager", () => {
  const manager = new AiFortificationManager(profile, () => catalog);

  it("WALL-01/02 creates a deterministic bounded front with a permanently empty opening", () => {
    const first = manager.propose(observation(), threatenedState());
    const second = manager.propose(observation(), threatenedState());
    const graph = first.statePatch?.fortifications?.[0]?.graph;

    expect(graph).toEqual(second.statePatch?.fortifications?.[0]?.graph);
    expect(graph?.wholeConnectivity).toBe("preserved");
    expect(graph?.incrementalConnectivity).toBe("preserved");
    expect(graph?.nodes.filter((node) => node.kind === "gate_slot")).toHaveLength(1);
    expect(first.intents.every((intent) => intent.kind !== "construct" || intent.objectName !== null)).toBe(true);
  });

  it("H-27 rejects an unanchored open-field wall that has no measured choke value", () => {
    const open = observation();
    const proposal = manager.propose(
      {
        ...open,
        map: {
          ...open.map!,
          constructionCells: open.map!.constructionCells!.map((cell) => ({
            ...cell,
            groundPassable: true,
            observedBlocked: false
          }))
        }
      },
      threatenedState()
    );

    expect(proposal.statePatch?.fortifications).toEqual([]);
    expect(proposal.reasons).toContain("no_justified_connected_choke");
  });

  it("WALL-03 records marginal tower coverage and only definition-supported target domains", () => {
    const graph = manager.propose(observation(), threatenedState()).statePatch?.fortifications?.[0]?.graph;
    const towers = graph?.nodes.filter((node) => node.kind === "tower") ?? [];

    expect(towers).toHaveLength(2);
    expect(towers.every((tower) => tower.marginalCoverage > 0)).toBe(true);
    expect(towers.every((tower) => !tower.targetDomains.includes("air"))).toBe(true);
    expect(graph?.nodes.filter((node) => node.kind === "stair").every((stair) => stair.defenderPostReachable)).toBe(
      true
    );
  });

  it("does not mistake a stationary building footprint for a traversable route that must reach the gate", () => {
    const source = observation();
    const proposal = manager.propose(
      {
        ...source,
        map: {
          ...source.map!,
          constructionCells: source.map!.constructionCells!.map((cell) =>
            cell.tileKey === "5,10" ? { ...cell, groundPassable: false, observedBlocked: true } : cell
          )
        }
      },
      threatenedState()
    );

    expect(proposal.statePatch?.fortifications).toHaveLength(1);
    expect(proposal.statePatch?.fortifications?.[0]?.graph?.nodes.filter((node) => node.kind === "stair")).toHaveLength(
      2
    );
  });

  it("WALL-05 rejects a front that would consume a known shore staging lane", () => {
    const current = observation();
    const proposal = manager.propose(
      {
        ...current,
        map: {
          ...current.map!,
          accessGraph: {
            schemaVersion: 1,
            generation: 1,
            status: "ready",
            staticRevision: 1,
            dynamicRevision: 1,
            threatRevision: 1,
            builtTick: current.tick,
            continuationCursor: 0,
            nodes: [],
            links: [],
            unknownNodeIds: [],
            transferPoints: [
              {
                transferId: "shore:fortification",
                kind: "shore",
                fromNodeId: "access:ground",
                toNodeId: "access:water",
                passengerPosition: { x: 9, y: 7, z: 0 },
                carrierPosition: { x: 10, y: 7, z: 0 },
                clearance: 2,
                knowledge: "known_static"
              }
            ]
          }
        }
      },
      threatenedState()
    );

    expect(proposal.statePatch?.fortifications).toEqual([]);
    expect(proposal.reasons).toContain("no_justified_connected_choke");
  });

  it("reuses the reserved opening node for a future gate-capable definition without redesigning the graph", () => {
    const gateManager = new AiFortificationManager(profile, () => catalog, ObjectNames.Olival);
    const proposal = gateManager.propose(observation(), threatenedState());
    const graph = proposal.statePatch?.fortifications?.[0]?.graph;
    const opening = graph?.nodes.find((node) => node.nodeId === graph?.openingNodeId);

    expect(opening?.kind).toBe("gate_slot");
    expect(opening?.objectName).toBe(ObjectNames.Olival);
    expect(opening?.lifecycle).toBe("planned");
    expect(graph?.constructionSequenceNodeIds.at(-1)).toBe(opening?.nodeId);
  });

  it("preserves worker, survival, and supply macro floors before funding a new wall", () => {
    const state = threatenedState();
    const proposal = manager.propose(observation(), {
      ...state,
      economyProduction: {
        ...state.economyProduction,
        demands: [
          {
            demandId: "demand:supply:buffer",
            purpose: "supply_buffer",
            capabilityOrRole: "housing",
            unit: "population",
            desired: 3,
            satisfiedActorIds: [],
            queuedIds: [],
            constructingIds: [],
            acceptedNotObservedEffectIds: [],
            preferredObjectNames: [ObjectNames.Olival],
            resourceObligations: { [ResourceType.Stone]: 50 }
          }
        ]
      }
    });

    expect(proposal.statePatch?.fortifications).toEqual([]);
    expect(proposal.reasons).toContain("macro_survival_or_supply_floor_unmet");
  });
});

describe("fortification native work ownership", () => {
  const manager = new AiFortificationManager(profile, () => catalog);

  it("keeps a partial construction requested and does not unlock its connected successor", () => {
    const first = manager.propose(observation(), threatenedState());
    const plan = first.statePatch?.fortifications?.[0];
    const root = plan?.graph?.nodes.find((node) => node.kind !== "gate_slot" && node.dependsOnNodeId === null);
    const successor = plan?.graph?.nodes.find((node) => node.dependsOnNodeId === root?.nodeId);
    if (!plan || !root?.objectName || !successor) throw new Error("invalid_partial_site_fixture");
    const partial = {
      ...actor("partial-site", root.objectName, root.position.x, root.position.y),
      constructionProgress: { status: "known" as const, value: 50, observedTick: 120 }
    };
    const proposal = manager.propose(observation([partial], 120), { ...threatenedState(), fortifications: [plan] });
    const nextRoot = proposal.statePatch?.fortifications?.[0]?.graph?.nodes.find((node) => node.nodeId === root.nodeId);

    expect(nextRoot?.lifecycle).toBe("requested");
    expect(
      proposal.intents.some((intent) => intent.kind === "construct" && intent.siteKey.includes(successor.nodeId))
    ).toBe(false);
  });

  it("H-28 reuses stable node effects and WALL-04 turns a missing finished node into one bounded repair", () => {
    const first = manager.propose(observation(), threatenedState());
    const plannedState = { ...threatenedState(), fortifications: first.statePatch!.fortifications! };
    const repeated = manager.propose(observation(), plannedState);
    expect(repeated.intents.map((intent) => intent.effectId)).toEqual(first.intents.map((intent) => intent.effectId));
    const firstConstruct = first.intents.find((intent) => intent.kind === "construct");
    const firstNode = first.statePatch!.fortifications![0]!.graph!.nodes.find(
      (node) => node.effectId === firstConstruct?.effectId
    );
    const reservedState: AiBrainStateV1 = {
      ...plannedState,
      reservations:
        firstNode && firstConstruct
          ? [
              {
                claimId: `claim:fortification:${firstNode.nodeId}:effect`,
                subjectKey: `effect:${firstConstruct.effectId}`,
                ownerPlanId: firstConstruct.planId,
                state: { kind: "provisional", expiresAt: aiDeadline(180) },
                prerequisites: [],
                createdTick: 100
              }
            ]
          : []
    };
    const underConstruction = manager.propose(observation([], 120), reservedState);
    expect(underConstruction.intents.some((intent) => intent.effectId === firstConstruct?.effectId)).toBe(false);

    const plan = first.statePatch!.fortifications![0]!;
    const root = plan.graph!.nodes.find((node) => node.kind !== "gate_slot" && node.dependsOnNodeId === null)!;
    const breachedState = {
      ...threatenedState(),
      squads: [
        {
          squadId: "squad:defense" as const,
          role: "defense" as const,
          domain: "ground" as const,
          actorIds: ["guard" as ActorId],
          objectiveId: null,
          state: "ready" as const
        }
      ],
      fortifications: [
        {
          ...plan,
          lifecycle: "active" as const,
          graph: {
            ...plan.graph!,
            nodes: plan.graph!.nodes.map((node) =>
              node.nodeId === root.nodeId
                ? {
                    ...node,
                    lifecycle: "finished" as const,
                    completedActorId: "destroyed-wall" as ActorId,
                    retryAfterTick: 0
                  }
                : node
            )
          }
        }
      ]
    };
    const breached = manager.propose(
      observation([actor("guard", ObjectNames.TivaraMacemanMale, 7, 10)], 200),
      breachedState
    );

    expect(breached.statePatch?.fortifications).toHaveLength(1);
    expect(breached.statePatch?.fortifications?.[0]?.lifecycle).toBe("breached");
    expect(breached.intents.filter((intent) => intent.reasonCode.includes("breach_rebuild"))).toHaveLength(1);
    expect(
      breached.intents.some((intent) => intent.kind === "move" && intent.reasonCode.includes("breach_defenders"))
    ).toBe(true);
  });

  it("WALL-04 repairs a destroyed stair without recreating its retained connected component", () => {
    const first = manager.propose(observation(), threatenedState());
    const plan = first.statePatch?.fortifications?.[0];
    const stair = plan?.graph?.nodes.find((node) => node.kind === "stair");
    const dependency = plan?.graph?.nodes.find((node) => node.nodeId === stair?.dependsOnNodeId);
    if (!plan?.graph || !stair || !dependency?.objectName) throw new Error("invalid_fortification_fixture");
    const state: AiBrainStateV1 = {
      ...threatenedState(),
      fortifications: [
        {
          ...plan,
          lifecycle: "active",
          graph: {
            ...plan.graph,
            nodes: plan.graph.nodes.map((node) =>
              node.nodeId === stair.nodeId
                ? {
                    ...node,
                    lifecycle: "finished" as const,
                    completedActorId: "old-stair" as ActorId,
                    retryAfterTick: 0
                  }
                : node.nodeId === dependency.nodeId
                  ? {
                      ...node,
                      lifecycle: "finished" as const,
                      completedActorId: "retained-segment" as ActorId,
                      retryAfterTick: 400
                    }
                  : node
            )
          }
        }
      ]
    };
    const retained = actor("retained-segment", dependency.objectName, dependency.position.x, dependency.position.y);
    const proposal = manager.propose(observation([retained], 200), state);

    expect(proposal.statePatch?.fortifications).toHaveLength(1);
    expect(
      proposal.intents.some((intent) => intent.kind === "construct" && intent.objectName === ObjectNames.Stairs)
    ).toBe(true);
  });
});
