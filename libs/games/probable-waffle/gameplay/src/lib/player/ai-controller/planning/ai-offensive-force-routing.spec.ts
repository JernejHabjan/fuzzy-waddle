import type { AiObservedActorV1 } from "../contracts/ai-observation-v1";
import { guard, core, producer, world, brain, manager } from "./ai-offensive-opportunity-test-fixtures";
import { createAiSkirmishProposalContext } from "./ai-skirmish-proposal-draft";
import { selectAiOffensiveOpportunity } from "./select-ai-offensive-opportunity";

function flyer(id: string): AiObservedActorV1 {
  const actor = guard(id, "self", 0);
  return {
    ...actor,
    accessNodeId: { status: "known", value: "access:region:air:global", observedTick: 20 },
    capabilities: actor.capabilities.map((capability) => ({ ...capability, domains: ["air"] }))
  };
}

describe("offensive force routing and domain readiness", () => {
  it("keeps a ground anti-air force eligible for an observed flying objective", () => {
    const attackers = Array.from({ length: 3 }, (_, i) => {
      const actor = guard(`interceptor-${i}`, "self", 0);
      return {
        ...actor,
        capabilities: actor.capabilities.map((capability) => ({ ...capability, targetDomains: ["air" as const] }))
      };
    });
    const target = { ...flyer("enemy-air"), relation: "enemy" as const, visibility: "visible" as const, owner: 2 };
    const context = createAiSkirmishProposalContext(world([...attackers, target]), brain(), {
      schemaVersion: 1,
      generation: 1,
      unsupported: [],
      entries: []
    });
    const choice = selectAiOffensiveOpportunity(context, attackers);
    expect(choice.route?.kind).toBe("air_or_naval_objective");
    expect(choice.assessment).toMatchObject({ reason: "credible_force_and_route", readyForce: 3, requiredForce: 3 });
  });
  it("meets the developed-base force gate with both domains after retaining the home reserve", () => {
    const army = [
      ...Array.from({ length: 7 }, (_, i) => guard(`ground-${i}`, "self", 0)),
      ...Array.from({ length: 4 }, (_, i) => flyer(`air-${i}`))
    ];
    const result = manager.propose(world([...army, core("core"), producer("range"), producer("inn")]), brain());
    expect(result.statePatch?.strategy?.assessment).toMatchObject({
      choice: "finish",
      readyForce: 8,
      requiredForce: 8
    });
    expect(result.statePatch?.squads?.find((entry) => entry.role === "reserve")?.actorIds).toHaveLength(3);
    expect(result.intents.find((intent) => intent.kind === "attack")?.actorIds).toHaveLength(8);
  });
  it("launches independently reachable ground and air units as one useful force", () => {
    const result = manager.propose(world([guard("ground", "self", 0), flyer("air"), core("enemy-core")]), brain());
    expect(result.statePatch?.strategy?.assessment).toMatchObject({ choice: "finish", readyForce: 2 });
    expect(result.intents).toContainEqual(expect.objectContaining({ kind: "attack", actorIds: ["air", "ground"] }));
  });

  it("does not certify disconnected ground reinforcements from the first actor's route", () => {
    const blocked = {
      ...guard("z-blocked", "self", 0),
      accessNodeId: { status: "known" as const, value: "access:region:ground:isolated" as const, observedTick: 20 }
    };
    const observation = world([guard("a-ready", "self", 0), blocked, core("enemy-core")]);
    const graph = observation.map!.accessGraph!;
    const result = manager.propose(
      {
        ...observation,
        map: {
          ...observation.map!,
          accessGraph: {
            ...graph,
            nodes: [...graph.nodes, { ...graph.nodes[0]!, nodeId: blocked.accessNodeId.value }]
          }
        }
      },
      brain()
    );
    expect(result.statePatch?.strategy?.assessment).toMatchObject({ readyForce: 1, requiredForce: 2 });
    expect(result.intents.some((intent) => intent.kind === "attack")).toBe(false);
  });

  it("does not demand an anti-ground defense allowance for a purely airborne attack", () => {
    const enemies = Array.from({ length: 4 }, (_, i) => guard(`defender-${i}`, "enemy", 1));
    const attackers = [flyer("a"), flyer("b")];
    const context = createAiSkirmishProposalContext(world([...attackers, core("enemy-core"), ...enemies]), brain(), {
      schemaVersion: 1,
      generation: 1,
      unsupported: [],
      entries: []
    });
    const result = selectAiOffensiveOpportunity(context, attackers);
    expect(result.assessment).toMatchObject({
      choice: "finish",
      readyForce: 2,
      requiredForce: 2,
      visibleThreatCount: 0
    });
  });
});
