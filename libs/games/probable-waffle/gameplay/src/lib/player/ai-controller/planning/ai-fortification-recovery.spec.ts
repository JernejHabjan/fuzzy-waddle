import type { ActorId } from "@fuzzy-waddle/platform-game-sessions";
import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import { aiDeadline } from "../contracts/ai-core-types";
import { arbitrateAiIntents } from "../brain/ai-intent-arbiter";
import { AiFortificationManager } from "./ai-fortification-manager";
import { profile, catalog, actor, observation, threatenedState } from "./ai-fortification-test-fixture";

describe("fortification recovery ownership", () => {
  const manager = new AiFortificationManager(profile, () => catalog);
  it("assigns separate workers to simultaneous construction nodes", () => {
    const builds = manager
      .propose(observation(), threatenedState())
      .intents.filter((intent) => intent.kind === "construct");
    expect(builds).toHaveLength(2);
    expect(new Set(builds.flatMap((intent) => intent.builderIds)).size).toBe(2);
  });
  it.each(["cargo", "in-flight"])("does not steal a worker with %s resource ownership", (route) => {
    const current = observation();
    const proposal = manager.propose(
      {
        ...current,
        actors: current.actors.map((actor) =>
          actor.objectName === ObjectNames.TivaraWorker
            ? {
                ...actor,
                carriedResourceAmount: route === "cargo" ? 10 : 0,
                resourceTransferInFlight: route === "in-flight"
              }
            : actor
        )
      },
      threatenedState()
    );
    expect(proposal.intents.filter((intent) => intent.kind === "construct")).toHaveLength(0);
  });
  it("uses a new effect after a finished node is destroyed, without resetting its retry identity on completion", () => {
    const first = manager.propose(observation(), threatenedState());
    const plan = first.statePatch?.fortifications?.[0];
    const root = plan?.graph?.nodes.find((node) => node.effectId !== null);
    if (!plan?.graph || !root?.objectName || !root.effectId) throw new Error("missing_root_fixture");
    const retainedPlan = {
      ...plan,
      graph: {
        ...plan.graph,
        nodes: plan.graph.nodes.map((node) =>
          node.nodeId === root.nodeId
            ? {
                ...node,
                lifecycle: "finished" as const,
                completedActorId: "lost-wall" as ActorId,
                attempt: 1,
                retryAfterTick: 0
              }
            : node
        )
      }
    };
    const retained = actor("lost-wall", root.objectName, root.position.x, root.position.y);
    const seen = manager.propose(observation([retained], 160), {
      ...threatenedState(),
      fortifications: [retainedPlan]
    });
    const seenPlan = seen.statePatch?.fortifications?.[0];
    expect(seenPlan?.graph?.nodes.find((node) => node.nodeId === root.nodeId)?.attempt).toBe(1);
    if (!seenPlan) throw new Error("missing_seen_plan");
    const breached = manager.propose(observation([], 220), { ...threatenedState(), fortifications: [seenPlan] });
    const replacement = breached.intents.find(
      (intent) => intent.kind === "construct" && intent.siteKey.includes(root.nodeId)
    );
    expect(replacement?.effectId).toBe(`effect:fortification:${plan.planId}:${root.nodeId}:2`);
    expect(replacement?.effectId).not.toBe(root.effectId);
  });
  it("keeps an abandoned low-value perimeter terminal on subsequent decisions", () => {
    const plan = manager.propose(observation(), threatenedState()).statePatch?.fortifications?.[0];
    if (!plan) throw new Error("missing_plan");
    const proposal = manager.propose(observation([], 300), {
      ...threatenedState(),
      fortifications: [{ ...plan, lifecycle: "abandoned" }]
    });
    expect(proposal.statePatch?.fortifications?.[0]?.lifecycle).toBe("abandoned");
    expect(proposal.intents).toEqual([]);
  });
  it("skips a newly blocked footprint while continuing the other connected side", () => {
    const first = manager.propose(observation(), threatenedState());
    const plan = first.statePatch?.fortifications?.[0];
    const blocked = plan?.graph?.nodes.find((node) => node.kind !== "gate_slot" && node.dependsOnNodeId === null);
    if (!plan || !blocked) throw new Error("missing_plan");
    const current = observation([], 150);
    if (!current.map) throw new Error("missing_observed_map");
    const proposal = manager.propose(
      {
        ...current,
        map: {
          ...current.map,
          constructionCells: current.map?.constructionCells?.map((cell) =>
            blocked.footprintTileKeys.includes(cell.tileKey)
              ? { ...cell, groundPassable: false, observedBlocked: true }
              : cell
          )
        }
      },
      { ...threatenedState(), fortifications: [plan] }
    );
    const builds = proposal.intents.filter((intent) => intent.kind === "construct");
    expect(builds).toHaveLength(1);
    expect(builds[0]?.siteKey).not.toContain(blocked.nodeId);
  });
  it("abandons construction for a lost protected base without blocking a surviving base", () => {
    const plan = manager.propose(observation(), threatenedState()).statePatch?.fortifications?.[0];
    if (!plan) throw new Error("missing_plan");
    const state = threatenedState();
    const proposal = manager.propose(observation([], 300), {
      ...state,
      bases: state.bases.map((base) => ({ ...base, active: false, lifecycle: "lost" })),
      fortifications: [plan]
    });
    expect(proposal.statePatch?.fortifications?.[0]?.lifecycle).toBe("abandoned");
    expect(proposal.intents).toEqual([]);
  });
  it("does not select a worker already leased by another construction plan", () => {
    const state = threatenedState();
    const proposal = manager.propose(observation(), {
      ...state,
      reservations: [
        {
          claimId: "claim:other:builder",
          subjectKey: "actor:worker",
          ownerPlanId: "plan:other",
          state: { kind: "provisional", expiresAt: aiDeadline(300) },
          prerequisites: [],
          createdTick: 90
        }
      ]
    });
    const builds = proposal.intents.filter((intent) => intent.kind === "construct");
    expect(builds).toHaveLength(1);
    expect(builds[0]?.builderIds).toEqual(["worker-reserve"]);
  });
  it("does not let an old effect reservation suppress a new replacement attempt", () => {
    const first = manager.propose(observation(), threatenedState());
    const plan = first.statePatch?.fortifications?.[0];
    const root = plan?.graph?.nodes.find((node) => node.effectId !== null);
    if (!plan?.graph || !root?.effectId) throw new Error("missing_root_fixture");
    const replacement = {
      ...plan,
      graph: {
        ...plan.graph,
        nodes: plan.graph.nodes.map((node) =>
          node.nodeId === root.nodeId ? { ...node, lifecycle: "planned" as const, attempt: 1, effectId: null } : node
        )
      }
    };
    const state: AiBrainStateV1 = {
      ...threatenedState(),
      fortifications: [replacement],
      reservations: [
        {
          claimId: `claim:fortification:${root.nodeId}:effect`,
          subjectKey: `effect:${root.effectId}`,
          ownerPlanId: `plan:${plan.planId}`,
          state: { kind: "applied_spending", appliedTick: 100 },
          prerequisites: [],
          createdTick: 90
        }
      ]
    };
    const current = observation([], 200);
    const proposal = manager.propose(current, state);
    const admitted = arbitrateAiIntents(current, state, proposal.intents, [], profile, undefined);
    expect(
      admitted.accepted.some((intent) => intent.kind === "construct" && intent.siteKey.includes(root.nodeId))
    ).toBe(true);
  });
});
