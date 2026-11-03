import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiResourceCostClaims } from "./ai-resource-cost-claims";

describe("catalog-priced resource claims", () => {
  it("uses stable resource order and ignores zero-cost entries", () => {
    const claims = createAiResourceCostClaims("claim:building" as never, {
      [ResourceType.Wood]: 80,
      [ResourceType.Food]: 0,
      [ResourceType.Stone]: 30
    });

    expect(claims).toEqual([
      { claimId: "claim:building:stone", kind: "resource", resourceType: ResourceType.Stone, amount: 30 },
      { claimId: "claim:building:wood", kind: "resource", resourceType: ResourceType.Wood, amount: 80 }
    ]);
  });
});
