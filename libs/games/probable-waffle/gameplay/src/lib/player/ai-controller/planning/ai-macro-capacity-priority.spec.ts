import { FactionType, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiProductionPolicyFixture } from "../testing/ai-production-policy-fixture";
import { createAiTestOwnedActor } from "../testing/ai-test-fixtures";
import { AiMacroManager } from "./ai-macro-manager";

describe.each([FactionType.Tivara, FactionType.Skaduwee])("dated capacity builder priority %s", (faction) => {
  it("secures the only known reachable builder before optional gathering claims it", () => {
    const f = createAiProductionPolicyFixture(faction);
    const source = {
      ...createAiTestOwnedActor("wood-source"),
      relation: "neutral" as const,
      visibility: "visible" as const,
      resourceState: {
        status: "known" as const,
        observedTick: f.observation.tick,
        value: {
          resourceType: ResourceType.Wood,
          available: { status: "known" as const, value: 1000, observedTick: f.observation.tick },
          carried: { status: "unknown" as const, reason: "not_supported" as const },
          growthReadyTick: { status: "unknown" as const, reason: "not_supported" as const },
          serviceCapacity: { status: "known" as const, value: 10, observedTick: f.observation.tick }
        }
      }
    };
    const observation = {
      ...f.observation,
      actors: [
        ...f.observation.actors.map((entry) => {
          const actor = {
            ...entry,
            activeOrder: {
              status: "known" as const,
              value: null,
              observedTick: f.observation.tick
            }
          };
          return actor.actorId.startsWith("worker-") && actor.actorId !== "worker-0"
            ? {
                ...actor,
                logicalPosition: {
                  status: "known" as const,
                  value: { x: 20, y: 20, z: 0 },
                  observedTick: f.observation.tick
                }
              }
            : actor;
        }),
        source
      ]
    };
    const proposal = new AiMacroManager(() => f.catalog).propose(observation, f.state);
    const capacity = proposal.intents.find(
      (intent) => intent.kind === "construct" && intent.objectName === f.producerName
    );
    expect(capacity).toMatchObject({ builderIds: ["worker-0"] });
    expect(
      proposal.intents.some((intent) => intent.kind === "assign_gatherers" && intent.actorIds.includes("worker-0"))
    ).toBe(false);
    expect(proposal.intents.some((intent) => intent.kind === "assign_gatherers" && intent.actorIds.length > 0)).toBe(
      true
    );
  });
});
