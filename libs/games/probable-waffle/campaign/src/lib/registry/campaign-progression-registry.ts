import type {
  CampaignCurrencyId,
  CampaignHeroId,
  CampaignInventoryItemDefinitionId,
  CampaignProgressionUpgradeId,
  CampaignTemporaryBoostId,
  CampaignUnlockId
} from "@fuzzy-waddle/probable-waffle-protocol";
import type {
  CampaignCurrencyDefinition,
  CampaignHeroDefinition,
  CampaignInventoryItemDefinition,
  CampaignProgressionDefinitions,
  CampaignProgressionUpgradeDefinition,
  CampaignTemporaryBoostDefinition,
  CampaignUnlockDefinition
} from "../contracts/campaign-progression-definition";

/** Immutable definition authority shared by launch, simulation adapters, UI, and reward commits. */
export class CampaignProgressionRegistry {
  private readonly currencies: ReadonlyMap<CampaignCurrencyId, CampaignCurrencyDefinition>;
  private readonly heroes: ReadonlyMap<CampaignHeroId, CampaignHeroDefinition>;
  private readonly unlocks: ReadonlyMap<CampaignUnlockId, CampaignUnlockDefinition>;
  private readonly upgrades: ReadonlyMap<CampaignProgressionUpgradeId, CampaignProgressionUpgradeDefinition>;
  private readonly items: ReadonlyMap<CampaignInventoryItemDefinitionId, CampaignInventoryItemDefinition>;
  private readonly temporaryBoosts: ReadonlyMap<CampaignTemporaryBoostId, CampaignTemporaryBoostDefinition>;

  constructor(definitions: CampaignProgressionDefinitions) {
    this.currencies = uniqueMap(definitions.currencies, "currency");
    this.heroes = uniqueMap(definitions.heroes, "hero");
    this.unlocks = uniqueMap(definitions.unlocks, "unlock");
    this.upgrades = uniqueMap(definitions.upgrades, "upgrade");
    this.items = uniqueMap(definitions.items, "item");
    this.temporaryBoosts = uniqueMap(definitions.temporaryBoosts, "temporary boost");
    for (const currency of definitions.currencies) {
      if (!Number.isFinite(currency.initialBalance) || currency.initialBalance < 0) {
        throw new Error(`Campaign currency '${currency.id}' has an invalid initial balance`);
      }
    }
    for (const upgrade of definitions.upgrades) {
      if (!this.currencies.has(upgrade.currencyId)) {
        throw new Error(`Campaign upgrade '${upgrade.id}' uses unknown currency '${upgrade.currencyId}'`);
      }
      if (!Number.isFinite(upgrade.cost) || upgrade.cost < 0) {
        throw new Error(`Campaign upgrade '${upgrade.id}' has an invalid cost`);
      }
    }
    for (const modifier of [
      ...definitions.upgrades.flatMap((definition) => definition.modifiers),
      ...definitions.items.flatMap((definition) => definition.modifiers ?? []),
      ...definitions.temporaryBoosts.flatMap((definition) => definition.modifiers)
    ]) {
      if (
        (modifier.stat === "movement-speed" || modifier.stat === "cooldown") &&
        (modifier.operation !== "multiply" || modifier.value <= 0)
      ) {
        throw new Error(`Campaign ${modifier.stat} modifiers must be positive multipliers`);
      }
    }
  }

  getCurrency(id: CampaignCurrencyId): CampaignCurrencyDefinition | undefined {
    return this.currencies.get(id);
  }

  getHero(id: CampaignHeroId): CampaignHeroDefinition | undefined {
    return this.heroes.get(id);
  }

  getUnlock(id: CampaignUnlockId): CampaignUnlockDefinition | undefined {
    return this.unlocks.get(id);
  }

  getUpgrade(id: CampaignProgressionUpgradeId): CampaignProgressionUpgradeDefinition | undefined {
    return this.upgrades.get(id);
  }

  getItem(id: CampaignInventoryItemDefinitionId): CampaignInventoryItemDefinition | undefined {
    return this.items.get(id);
  }

  getTemporaryBoost(id: CampaignTemporaryBoostId): CampaignTemporaryBoostDefinition | undefined {
    return this.temporaryBoosts.get(id);
  }

  currencyDefinitions(): readonly CampaignCurrencyDefinition[] {
    return [...this.currencies.values()];
  }

  heroDefinitions(): readonly CampaignHeroDefinition[] {
    return [...this.heroes.values()];
  }
}

function uniqueMap<TDefinition extends { readonly id: string }>(
  definitions: readonly TDefinition[],
  label: string
): ReadonlyMap<string, TDefinition> {
  const result = new Map<string, TDefinition>();
  for (const definition of definitions) {
    if (result.has(definition.id)) throw new Error(`Duplicate campaign ${label} '${definition.id}'`);
    result.set(definition.id, definition);
  }
  return result;
}
