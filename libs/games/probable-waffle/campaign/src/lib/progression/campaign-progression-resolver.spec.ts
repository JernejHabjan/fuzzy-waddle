import { FactionType, ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import {
  AOTA_CAMPAIGN_CRYSTAL_ID,
  AOTA_CAMPAIGN_PROGRESSION_REGISTRY
} from "../catalog/ashes-of-the-ancients-progression";
import type { CampaignProgressionDefinitions } from "../contracts/campaign-progression-definition";
import { CampaignProgressionRegistry } from "../registry/campaign-progression-registry";
import {
  capCampaignProgressionModifiers,
  createInitialCampaignProgressionProfile,
  resolveCampaignEffectiveProgression,
  respecCampaignProgression,
  saveCampaignLoadout
} from "./campaign-progression-resolver";

describe("campaign progression resolver", () => {
  it("creates the two stable heroes and one earned campaign crystal", () => {
    const profile = createInitialCampaignProgressionProfile(AOTA_CAMPAIGN_PROGRESSION_REGISTRY);

    expect(profile.wallet.balances[AOTA_CAMPAIGN_CRYSTAL_ID]).toBe(1);
    expect(AOTA_CAMPAIGN_PROGRESSION_REGISTRY.getHero("tivara-hero")?.actorName).toBe(ObjectNames.TivaraMacemanMale);
    expect(AOTA_CAMPAIGN_PROGRESSION_REGISTRY.getHero("skaduwee-hero")?.actorName).toBe(
      ObjectNames.SkaduweeWarriorMale
    );
  });

  it("freely respecs within the same refundable currency budget", () => {
    const registry = progressionRegistry();
    const initial = {
      ...createInitialCampaignProgressionProfile(registry),
      discoveredUpgradeIds: ["health", "speed"],
      wallet: { balances: { crystal: 2 } }
    };
    const first = respecCampaignProgression(initial, ["health"], registry);
    const second = respecCampaignProgression(first.profile, ["speed"], registry);

    expect(first.accepted).toBe(true);
    expect(second.accepted).toBe(true);
    expect(second.profile.purchasedUpgradeIds).toEqual(["speed"]);
    expect(second.profile.wallet.balances.crystal).toBe(1);
  });

  it("intersects multiple loadout slots with early-mission unlock restrictions without mutating the profile", () => {
    const registry = progressionRegistry();
    const profile = {
      ...createInitialCampaignProgressionProfile(registry),
      purchasedUpgradeIds: ["health", "speed"],
      unlockIds: ["early-unit", "late-unit"],
      inventory: [{ id: "item-1", definitionId: "relic", quantity: 1, consumable: false }],
      loadouts: {
        first: {
          id: "first",
          name: "First",
          upgradeIds: ["health"],
          unlockIds: ["early-unit"],
          inventoryItemIds: ["item-1"]
        },
        second: {
          id: "second",
          name: "Second",
          upgradeIds: ["speed"],
          unlockIds: ["late-unit"],
          inventoryItemIds: []
        }
      }
    };
    const effective = resolveCampaignEffectiveProgression(
      {
        profile,
        selectedLoadoutIds: ["first", "second"],
        allowance: { maxStoryChapter: "two-homelands", loadoutSlotCount: 2 }
      },
      registry
    );

    expect(effective.upgradeIds).toEqual(["health", "speed"]);
    expect(effective.unlockIds).toEqual(["early-unit"]);
    expect(effective.restrictionReasons).toContain("Unlock 'late-unit' is disabled by this mission");
    expect(profile.unlockIds).toEqual(["early-unit", "late-unit"]);
  });

  it("stores multiple valid loadouts while rejecting selections the profile does not own", () => {
    const registry = progressionRegistry();
    const profile = {
      ...createInitialCampaignProgressionProfile(registry),
      purchasedUpgradeIds: ["health"],
      unlockIds: ["early-unit"]
    };
    const first = saveCampaignLoadout(profile, {
      id: "first",
      name: "First",
      upgradeIds: ["health"],
      unlockIds: ["early-unit"],
      inventoryItemIds: []
    });
    const second = saveCampaignLoadout(first.profile, {
      id: "second",
      name: "Second",
      upgradeIds: [],
      unlockIds: [],
      inventoryItemIds: []
    });
    const invalid = saveCampaignLoadout(second.profile, {
      id: "invalid",
      name: "Invalid",
      upgradeIds: ["speed"],
      unlockIds: [],
      inventoryItemIds: []
    });

    expect(Object.keys(second.profile.loadouts).sort()).toEqual(["first", "second"]);
    expect(invalid.accepted).toBe(false);
  });

  it("caps movement speed and cooldown modifier stacks narrowly", () => {
    expect(
      capCampaignProgressionModifiers([
        { stat: "movement-speed", operation: "multiply", value: 1.2 },
        { stat: "movement-speed", operation: "multiply", value: 1.2 },
        { stat: "cooldown", operation: "multiply", value: 0.5 }
      ])
    ).toEqual([
      { stat: "cooldown", operation: "multiply", value: 0.75 },
      { stat: "movement-speed", operation: "multiply", value: 1.25 }
    ]);
  });
});

function progressionRegistry(): CampaignProgressionRegistry {
  const definitions: CampaignProgressionDefinitions = {
    currencies: [{ id: "crystal", title: "Crystal", initialBalance: 1 }],
    heroes: [],
    unlocks: [
      {
        id: "early-unit",
        title: "Early unit",
        kind: "unit",
        chapterId: "two-homelands",
        faction: FactionType.Tivara,
        objectName: ObjectNames.TivaraMacemanMale
      },
      {
        id: "late-unit",
        title: "Late unit",
        kind: "unit",
        chapterId: "crystal-war",
        faction: FactionType.Tivara,
        objectName: ObjectNames.TivaraAlchemist
      }
    ],
    upgrades: [
      {
        id: "health",
        title: "Health",
        currencyId: "crystal",
        cost: 1,
        scope: { kind: "global" },
        modifiers: [{ stat: "maximum-health", operation: "multiply", value: 1.1 }]
      },
      {
        id: "speed",
        title: "Speed",
        currencyId: "crystal",
        cost: 1,
        scope: { kind: "global" },
        modifiers: [{ stat: "movement-speed", operation: "multiply", value: 1.2 }]
      }
    ],
    items: [
      {
        id: "relic",
        title: "Relic",
        consumable: false,
        modifiers: [{ stat: "armor", operation: "add", value: 1 }]
      }
    ],
    temporaryBoosts: []
  };
  return new CampaignProgressionRegistry(definitions);
}
