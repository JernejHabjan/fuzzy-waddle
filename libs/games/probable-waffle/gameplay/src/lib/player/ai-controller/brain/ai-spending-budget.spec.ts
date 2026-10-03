import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import { aiSpendingBudgetConflict } from "./ai-spending-budget";

function purchase(id: string, category: AiIntentV1["spendingCategory"], amount: number): AiIntentV1 {
  return {
    kind: "stop",
    intentId: `intent:${id}`,
    effectId: `effect:${id}`,
    planId: "plan:opening",
    demandId: null,
    lane: "supply_production",
    proposedTick: 20,
    urgencyClass: 2,
    utility: 800,
    ...(category ? { spendingCategory: category } : {}),
    preconditions: [],
    claims: [{ claimId: `claim:${id}:wood`, kind: "resource", resourceType: ResourceType.Wood, amount }],
    reasonCode: id,
    actorIds: []
  };
}

const emptySpend = () => ({ economy: new Map<ResourceType, number>(), defense: new Map<ResourceType, number>() });

describe("aiSpendingBudgetConflict", () => {
  it("protects an affordable economic purchase when defense is lower priority in a safe posture", () => {
    const defense = purchase("defense", "defense", 100);
    const economy = purchase("economy", "economy", 100);

    expect(
      aiSpendingBudgetConflict(
        defense,
        [economy],
        { economyPermille: 650, defensePermille: 350 },
        () => 200,
        new Map(),
        emptySpend()
      )
    ).toBe(ResourceType.Wood);
  });

  it("protects an affordable defense purchase during an emergency", () => {
    const defense = purchase("defense", "defense", 100);
    const economy = purchase("economy", "economy", 100);

    expect(
      aiSpendingBudgetConflict(
        economy,
        [defense],
        { economyPermille: 200, defensePermille: 800 },
        () => 200,
        new Map(),
        emptySpend()
      )
    ).toBe(ResourceType.Wood);
  });

  it("never reserves idle resources and lets survival bypass a posture quota", () => {
    const economy = purchase("economy", "economy", 100);
    const survival = purchase("survival", "survival", 100);
    const budget = { economyPermille: 200, defensePermille: 800 };

    expect(aiSpendingBudgetConflict(economy, [], budget, () => 200, new Map(), emptySpend())).toBeNull();
    expect(aiSpendingBudgetConflict(survival, [economy], budget, () => 200, new Map(), emptySpend())).toBeNull();
  });

  it("releases the protected share once the other category has already spent it", () => {
    const defense = purchase("defense", "defense", 100);
    const economy = purchase("economy", "economy", 100);
    const spent = emptySpend();
    spent.economy.set(ResourceType.Wood, 100);

    expect(
      aiSpendingBudgetConflict(
        defense,
        [economy],
        { economyPermille: 650, defensePermille: 350 },
        () => 200,
        new Map([[ResourceType.Wood, 100]]),
        spent
      )
    ).toBeNull();
  });
});
