import { FactionType, ObjectNames, ProbableWaffleAiDifficulty, ResearchType, ResourceType }
  from "@fuzzy-waddle/probable-waffle-protocol";
import { arbitrateAiIntents } from "../brain/ai-intent-arbiter";
import { createAiBrainStateV1 } from "../brain/create-ai-brain-state-v1";
import { digestCanonicalAiValue } from "../brain/canonical-ai-serialization";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import { createAiTestObservation } from "./ai-test-fixtures";

const profile = { ...createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium), maxAcceptedCommandBatchesPerStep: 4 };
const state = createAiBrainStateV1({ playerNumber: 1, faction: FactionType.Tivara, profile, tick: 20, archetypeId: "balanced" });

/** Admission-layer claims only; these examples do not prove applied queue capacity or actual cancellation/refunds. */
function intent(kind: "produce" | "research", slot = 0): AiIntentV1 {
  const suffix = kind === "produce" ? "train" : "research";
  const common = {
    intentId: `intent:${suffix}` as const, effectId: `effect:${suffix}` as const, planId: state.opening.plan.planId,
    demandId: null, lane: "supply_production" as const, proposedTick: 20, urgencyClass: 3,
    utility: kind === "produce" ? 700 : 600, preconditions: [], reasonCode: "useful_catalog_priced_work",
    claims: [
      { claimId: `claim:${suffix}:slot` as const, kind: "production_slot" as const, producerId: "producer-1", slot },
      { claimId: `claim:${suffix}:wood` as const, kind: "resource" as const, resourceType: ResourceType.Wood, amount: 35 }
    ]
  };
  return kind === "produce" ? { ...common, kind, producerId: "producer-1", objectName: ObjectNames.TivaraMacemanMale }
    : { ...common, kind, producerId: "producer-1", researchType: ResearchType.TivaraMacemanUpgradeLevel2 };
}

function admit(stockpile: number, reservedUnspent = 0, obligationsDue = 0, proposed = [intent("produce"), intent("research", 1)]) {
  const observation = createAiTestObservation();
  return arbitrateAiIntents({ ...observation, resources: observation.resources.map((resource) => ({ ...resource,
    stockpile, reservedUnspent, obligationsDue })) }, state, proposed, [], profile, undefined);
}

describe("production resource authority admission layer", () => {
  it("train and research contend for the same physical slot identity even with different claim IDs", () => {
    const result = admit(100, 0, 0, [intent("produce"), intent("research")]);
    expect(result.accepted).toHaveLength(1);
    expect(result.decisions).toContainEqual(expect.objectContaining({ outcome: "rejected", reason: "claim_conflict",
      detail: "production:producer-1:0" }));
    const permuted = admit(100, 0, 0, [intent("research"), intent("produce")]);
    expect(digestCanonicalAiValue(permuted)).toBe(digestCanonicalAiValue(result));
  });

  it("shared stockpile subtracts unspent leases and pay-over-time obligations before another admission", () => {
    expect(admit(70).accepted).toHaveLength(2);
    expect(admit(69).accepted).toHaveLength(1);
    expect(admit(100, 31, 35).accepted).toHaveLength(0);
    expect(admit(100, 30, 35).accepted).toHaveLength(1);
  });

  it("an expected refund is absent from spendable cash until the authority observes its addition", () => {
    const pending = admit(34, 0, 0, [intent("produce")]);
    const applied = admit(35, 0, 0, [intent("produce")]);
    expect(pending.accepted).toHaveLength(0);
    expect(pending.decisions[0]).toMatchObject({ outcome: "rejected", reason: "resource_conflict" });
    expect(applied.accepted).toHaveLength(1);
    expect(new Set(Array.from({ length: 3 }, () => digestCanonicalAiValue(admit(34, 0, 0, [intent("produce")])))).size).toBe(1);
  });
});
