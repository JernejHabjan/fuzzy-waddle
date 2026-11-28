import { ObjectNames, OrderType } from "@fuzzy-waddle/probable-waffle-protocol";
import {
  createAiTestObservation,
  createAiTestOwnedActor
} from "../../../testing/fixtures/coordination/ai-test-fixtures";
import { catalog, completedOpeningState } from "../../../testing/fixtures/production/ai-macro-test-fixtures";
import { AiMacroManager } from "../../production/macro/ai-macro-manager";
import type { AiObservedActor } from "../../../contracts/observation/ai-observation";
import { aiDeadline } from "../../../contracts/ai-core-types";

function fixture() {
  const worker = {
    ...createAiTestOwnedActor("worker"),
    activeOrder: { status: "known" as const, value: null, observedTick: 20 }
  };
  const site = {
    ...createAiTestOwnedActor("abandoned-house"),
    objectName: ObjectNames.Olival,
    constructionProgress: { status: "known" as const, value: 0, observedTick: 20 }
  };
  const capabilities = {
    ...catalog,
    entries: catalog.entries.map((entry) =>
      entry.sourceObjectName === ObjectNames.Olival
        ? {
            ...entry,
            constructionProfile: {
              resourceCost: {},
              footprintRadiusTiles: 0,
              visionRange: null,
              navigableHeight: null,
              enterHeight: null,
              exitHeight: null,
              requiresAssignedBuilder: true
            }
          }
        : entry
    )
  };
  const state = completedOpeningState();
  const actors: AiObservedActor[] = [worker, site];
  const world = { ...createAiTestObservation(), actors };
  return { worker, site, capabilities, state, world, manager: new AiMacroManager(() => capabilities) };
}

describe("unfinished construction after the opening", () => {
  it("preserves an assigned job when advisory region identities are temporarily unavailable", () => {
    const f = fixture();
    const worker = {
      ...f.worker,
      accessNodeId: { status: "known" as const, value: "access:worker" as const, observedTick: 20 },
      activeOrder: {
        status: "known" as const,
        observedTick: 20,
        value: { orderType: OrderType.Build, targetActorId: f.site.actorId }
      }
    };
    const site = {
      ...f.site,
      accessNodeId: { status: "known" as const, value: "access:site" as const, observedTick: 20 }
    };
    const world = {
      ...f.world,
      actors: [worker, site],
      map: {
        ...f.world.map!,
        accessGraph: {
          schemaVersion: 1 as const,
          generation: 1,
          status: "ready" as const,
          staticRevision: 1,
          dynamicRevision: 1,
          threatRevision: 0,
          builtTick: 20,
          continuationCursor: 0,
          nodes: [],
          links: [],
          transferPoints: [],
          unknownNodeIds: []
        }
      }
    };
    const result = f.manager.propose(world, f.state);
    expect(result.intents.some((intent) => intent.kind === "stop" || intent.kind === "resume_construct")).toBe(false);
  });
  it("reassigns a builder without paying or placing another house", () => {
    const f = fixture();
    const proposal = f.manager.propose(f.world, f.state);
    const resume = proposal.intents.find((intent) => intent.kind === "resume_construct");
    expect(resume).toMatchObject({ actorIds: ["worker"], targetActorId: "abandoned-house" });
    expect(resume?.claims.some((claim) => claim.kind === "resource")).toBe(false);
    expect(
      proposal.intents.some((intent) => intent.kind === "construct" && intent.objectName === ObjectNames.Olival)
    ).toBe(false);
    expect(
      proposal.intents.some((intent) => intent.kind === "assign_gatherers" && intent.actorIds.includes("worker"))
    ).toBe(false);
  });

  it("does not repeatedly reassign a builder while its site recovery lease is active", () => {
    const f = fixture();
    const reserve = { ...f.worker, actorId: "worker-reserve" };
    const world = { ...f.world, actors: [f.worker, reserve, f.site] };
    const state = {
      ...f.state,
      reservations: [
        {
          claimId:
            `resume-construction:${f.site.actorId}:claim:41:0:builder` as (typeof f.state.reservations)[number]["claimId"],
          subjectKey: `actor:${f.worker.actorId}`,
          ownerPlanId: f.state.opening.plan.planId,
          state: { kind: "provisional" as const, expiresAt: aiDeadline(200) },
          prerequisites: [],
          createdTick: 20
        }
      ]
    };

    const proposal = f.manager.propose(world, state);
    const resume = proposal.intents.find((intent) => intent.kind === "resume_construct");

    expect(resume).toMatchObject({ actorIds: ["worker-reserve"], targetActorId: f.site.actorId });
  });

  it("retries an unreachable site with another builder after the native failure", () => {
    const f = fixture();
    const reserve = { ...f.worker, actorId: "worker-reserve" };
    const world = { ...f.world, actors: [f.worker, reserve, f.site] };
    const failure = {
      kind: "failed" as const,
      tick: 60,
      reason: "application_failed",
      actorIds: [f.worker.actorId],
      identity: {
        matchId: "match" as never,
        authorityEpoch: 0,
        playerNumber: 1,
        sequence: 41,
        commandId: "command:41" as never,
        effectId: "effect:resume-construction:abandoned-house:effect:41:0" as never,
        intentId: `intent:resume-construction:${f.site.actorId}:intent:41:0` as never
      }
    } satisfies (typeof f.state.pendingOutcomes)[number];
    const state = { ...f.state, pendingOutcomes: [failure] };

    const proposal = f.manager.propose(world, state);
    const resume = proposal.intents.find((intent) => intent.kind === "resume_construct");

    expect(resume).toMatchObject({ actorIds: ["worker-reserve"], targetActorId: f.site.actorId });
  });

  it("chooses a reachable builder instead of repeatedly assigning the nearest blocked worker", () => {
    const f = fixture();
    const reachable = {
      ...f.worker,
      actorId: "reachable",
      accessNodeId: {
        status: "known" as const,
        value: "access:site" as const,
        observedTick: 20
      }
    };
    const blocked = {
      ...f.worker,
      accessNodeId: {
        status: "known" as const,
        value: "access:blocked" as const,
        observedTick: 20
      }
    };
    const site = { ...f.site, accessNodeId: reachable.accessNodeId };
    const world = {
      ...f.world,
      actors: [blocked, reachable, site],
      accessProducts: [
        {
          queryId: "builder-site",
          revision: 1,
          status: "blocked" as const,
          fromNodeId: blocked.accessNodeId.value,
          toNodeId: site.accessNodeId.value,
          domains: ["ground" as const],
          updatedTick: 20
        }
      ]
    };
    expect(f.manager.propose(world, f.state).intents).toContainEqual(
      expect.objectContaining({
        kind: "resume_construct",
        actorIds: ["reachable"],
        targetActorId: site.actorId
      })
    );
  });

  it("reclaims a worker whose old construction target no longer exists", () => {
    const f = fixture();
    f.world.actors[0] = {
      ...f.worker,
      activeOrder: {
        status: "known",
        observedTick: 20,
        value: { orderType: OrderType.Build, targetActorId: "cancelled-site" }
      }
    };
    expect(f.manager.propose(f.world, f.state).intents).toContainEqual(
      expect.objectContaining({
        kind: "resume_construct",
        actorIds: ["worker"],
        targetActorId: f.site.actorId
      })
    );
  });

  it("releases a construction job when its only worker has a known impossible approach", () => {
    const f = fixture();
    const worker = {
      ...f.worker,
      logicalPosition: { status: "known" as const, value: { x: 0, y: 0, z: 0 }, observedTick: 20 },
      accessNodeId: { status: "known" as const, value: "access:worker" as const, observedTick: 20 },
      activeOrder: {
        status: "known" as const,
        observedTick: 20,
        value: { orderType: OrderType.Build, targetActorId: f.site.actorId }
      }
    };
    const site = {
      ...f.site,
      logicalPosition: { status: "known" as const, value: { x: 10, y: 10, z: 0 }, observedTick: 20 },
      accessNodeId: { status: "known" as const, value: "access:site" as const, observedTick: 20 }
    };
    const world = {
      ...f.world,
      actors: [worker, site],
      accessProducts: [
        {
          queryId: "blocked-site",
          revision: 1,
          status: "blocked" as const,
          fromNodeId: worker.accessNodeId.value,
          toNodeId: site.accessNodeId.value,
          domains: ["ground" as const],
          updatedTick: 20
        }
      ]
    };
    const result = f.manager.propose(world, f.state);
    expect(result.intents).toContainEqual(
      expect.objectContaining({
        kind: "stop",
        actorIds: [worker.actorId],
        reasonCode: "construction:release_unreachable_site"
      })
    );
    expect(result.intents.some((intent) => intent.kind === "resume_construct")).toBe(false);
  });

  it("keeps an assigned builder at the footprint edge when the structure region itself is unreachable", () => {
    const f = fixture();
    const worker = {
      ...f.worker,
      logicalPosition: { status: "known" as const, value: { x: 9, y: 10, z: 0 }, observedTick: 20 },
      accessNodeId: { status: "known" as const, value: "access:worker" as const, observedTick: 20 },
      activeOrder: {
        status: "known" as const,
        observedTick: 20,
        value: { orderType: OrderType.Build, targetActorId: f.site.actorId }
      }
    };
    const site = {
      ...f.site,
      logicalPosition: { status: "known" as const, value: { x: 10, y: 10, z: 0 }, observedTick: 20 },
      accessNodeId: { status: "known" as const, value: "access:site" as const, observedTick: 20 }
    };
    const world = {
      ...f.world,
      actors: [worker, site],
      accessProducts: [
        {
          queryId: "footprint-region",
          revision: 1,
          status: "blocked" as const,
          fromNodeId: worker.accessNodeId.value,
          toNodeId: site.accessNodeId.value,
          domains: ["ground" as const],
          updatedTick: 20
        }
      ]
    };

    const result = f.manager.propose(world, f.state);

    expect(result.intents.some((intent) => intent.kind === "stop")).toBe(false);
    expect(result.intents.some((intent) => intent.kind === "resume_construct")).toBe(false);
  });

  it.each(["assigned", "loaded", "busy", "automatic", "finished"] as const)("preserves %s ownership", (boundary) => {
    const f = fixture();
    if (boundary === "assigned")
      f.world.actors[0] = {
        ...f.worker,
        activeOrder: {
          status: "known",
          value: { orderType: OrderType.Build, targetActorId: f.site.actorId },
          observedTick: 20
        }
      };
    if (boundary === "loaded") f.world.actors[0] = { ...f.worker, carriedResourceAmount: 2 };
    if (boundary === "busy") f.world.actors[0] = { ...f.worker, resourceTransferInFlight: true };
    if (boundary === "automatic")
      f.capabilities.entries = f.capabilities.entries.map((entry) =>
        entry.constructionProfile
          ? { ...entry, constructionProfile: { ...entry.constructionProfile, requiresAssignedBuilder: false } }
          : entry
      );
    if (boundary === "finished")
      f.world.actors[1] = { ...f.site, constructionProgress: { status: "known", value: 100, observedTick: 20 } };
    expect(f.manager.propose(f.world, f.state).intents.some((intent) => intent.kind === "resume_construct")).toBe(
      false
    );
  });
});
