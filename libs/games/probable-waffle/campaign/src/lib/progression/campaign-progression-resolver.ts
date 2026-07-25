import type {
  CampaignEffectiveLoadout,
  CampaignFactionProgress,
  CampaignHeroProgress,
  CampaignLoadout,
  CampaignLoadoutId,
  CampaignMissionProgressionSnapshot,
  CampaignProgressionModifier,
  CampaignProgressionProfile,
  CampaignProgressionUpgradeId,
  CampaignTemporaryBoostId,
  FactionType
} from "@fuzzy-waddle/probable-waffle-protocol";
import type { MissionProgressionAllowance } from "../contracts/mission-progression-allowance";
import type { CampaignProgressionRegistry } from "../registry/campaign-progression-registry";

const CHAPTER_ORDER = ["prologue", "two-homelands", "crystal-war", "united-against-volcano", "the-betrayal"] as const;
const MOVEMENT_SPEED_MULTIPLIER_CAP = 1.25;
const MOVEMENT_SPEED_MULTIPLIER_FLOOR = 0.75;
const COOLDOWN_MULTIPLIER_FLOOR = 0.75;
const COOLDOWN_MULTIPLIER_CAP = 1.25;

export interface CampaignRespecResult {
  readonly profile: CampaignProgressionProfile;
  readonly accepted: boolean;
  readonly reason?: string;
}

export interface CampaignLoadoutUpdateResult {
  readonly profile: CampaignProgressionProfile;
  readonly accepted: boolean;
  readonly reason?: string;
}

export interface CampaignEffectiveProgressionRequest {
  readonly profile: CampaignProgressionProfile;
  readonly selectedLoadoutIds: readonly CampaignLoadoutId[];
  readonly temporaryBoostIds?: readonly CampaignTemporaryBoostId[];
  readonly allowance: MissionProgressionAllowance;
}

export function createInitialCampaignProgressionProfile(
  registry: CampaignProgressionRegistry
): CampaignProgressionProfile {
  return {
    schemaVersion: 1,
    revision: 0,
    wallet: {
      balances: Object.fromEntries(
        registry.currencyDefinitions().map((currency) => [currency.id, Math.max(0, currency.initialBalance)])
      )
    },
    discoveredUpgradeIds: [],
    permanentUpgradeIds: [],
    purchasedUpgradeIds: [],
    unlockIds: [],
    heroProgress: {},
    factionProgress: {},
    loadouts: {},
    inventory: [],
    rewardClaimIds: []
  };
}

export function createCampaignMissionProgressionSnapshot(
  request: CampaignEffectiveProgressionRequest,
  registry: CampaignProgressionRegistry
): CampaignMissionProgressionSnapshot {
  return {
    baseProfileRevision: request.profile.revision,
    profile: cloneProgressionProfile(request.profile),
    effectiveLoadout: resolveCampaignEffectiveProgression(request, registry),
    temporaryBoostIds: uniqueSorted(request.temporaryBoostIds ?? []),
    pendingRewardIds: []
  };
}

/** Rebuilds spendable upgrades from the full refundable budget; story unlocks and earned items are untouched. */
export function respecCampaignProgression(
  profile: CampaignProgressionProfile,
  desiredUpgradeIds: readonly CampaignProgressionUpgradeId[],
  registry: CampaignProgressionRegistry
): CampaignRespecResult {
  const desired = uniqueSorted(desiredUpgradeIds);
  const discovered = new Set(profile.discoveredUpgradeIds);
  const unknown = desired.find((id) => !discovered.has(id) || !registry.getUpgrade(id));
  if (unknown) return { profile, accepted: false, reason: `Upgrade '${unknown}' has not been discovered` };

  const balances = { ...profile.wallet.balances };
  for (const upgradeId of profile.purchasedUpgradeIds) {
    const upgrade = registry.getUpgrade(upgradeId);
    if (upgrade) balances[upgrade.currencyId] = (balances[upgrade.currencyId] ?? 0) + upgrade.cost;
  }
  for (const upgradeId of desired) {
    const upgrade = registry.getUpgrade(upgradeId);
    if (!upgrade) continue;
    const balance = balances[upgrade.currencyId] ?? 0;
    if (upgrade.cost < 0 || balance < upgrade.cost) {
      return { profile, accepted: false, reason: `Insufficient '${upgrade.currencyId}' for upgrade '${upgradeId}'` };
    }
    balances[upgrade.currencyId] = balance - upgrade.cost;
  }

  const heroProgress: Record<string, CampaignHeroProgress> = {};
  const factionProgress: Partial<Record<FactionType, CampaignFactionProgress>> = {};
  for (const [heroId, progress] of Object.entries(profile.heroProgress)) {
    heroProgress[heroId] = { upgradeIds: [], storySkillUnlockIds: [...progress.storySkillUnlockIds] };
  }
  for (const faction of Object.keys(profile.factionProgress).map(Number) as FactionType[]) {
    factionProgress[faction] = { upgradeIds: [] };
  }
  for (const upgradeId of uniqueSorted([...profile.permanentUpgradeIds, ...desired])) {
    const upgrade = registry.getUpgrade(upgradeId);
    if (upgrade?.scope.kind === "hero") {
      const current = heroProgress[upgrade.scope.heroId] ?? { upgradeIds: [], storySkillUnlockIds: [] };
      heroProgress[upgrade.scope.heroId] = { ...current, upgradeIds: uniqueSorted([...current.upgradeIds, upgradeId]) };
    } else if (upgrade?.scope.kind === "faction") {
      const current = factionProgress[upgrade.scope.faction] ?? { upgradeIds: [] };
      factionProgress[upgrade.scope.faction] = { upgradeIds: uniqueSorted([...current.upgradeIds, upgradeId]) };
    }
  }

  return {
    accepted: true,
    profile: {
      ...profile,
      revision: profile.revision + 1,
      wallet: { balances },
      purchasedUpgradeIds: desired,
      heroProgress,
      factionProgress
    }
  };
}

export function saveCampaignLoadout(
  profile: CampaignProgressionProfile,
  loadout: CampaignLoadout
): CampaignLoadoutUpdateResult {
  const ownedUpgrades = new Set([...profile.purchasedUpgradeIds, ...profile.permanentUpgradeIds]);
  const invalidUpgrade = loadout.upgradeIds.find((id) => !ownedUpgrades.has(id));
  if (invalidUpgrade) return { profile, accepted: false, reason: `Upgrade '${invalidUpgrade}' is not purchased` };
  const invalidUnlock = loadout.unlockIds.find((id) => !profile.unlockIds.includes(id));
  if (invalidUnlock) return { profile, accepted: false, reason: `Unlock '${invalidUnlock}' is unavailable` };
  const inventoryIds = new Set(profile.inventory.map((item) => item.id));
  const invalidItem = loadout.inventoryItemIds.find((id) => !inventoryIds.has(id));
  if (invalidItem) return { profile, accepted: false, reason: `Inventory item '${invalidItem}' is unavailable` };
  return {
    accepted: true,
    profile: {
      ...profile,
      revision: profile.revision + 1,
      loadouts: {
        ...profile.loadouts,
        [loadout.id]: {
          ...loadout,
          upgradeIds: uniqueSorted(loadout.upgradeIds),
          unlockIds: uniqueSorted(loadout.unlockIds),
          inventoryItemIds: uniqueSorted(loadout.inventoryItemIds)
        }
      }
    }
  };
}

/** Intersects current progression with immutable mission restrictions without mutating the profile. */
export function resolveCampaignEffectiveProgression(
  request: CampaignEffectiveProgressionRequest,
  registry: CampaignProgressionRegistry
): CampaignEffectiveLoadout {
  const reasons: string[] = [];
  const selectedLoadoutIds = uniqueSorted(request.selectedLoadoutIds).slice(0, request.allowance.loadoutSlotCount);
  if (uniqueSorted(request.selectedLoadoutIds).length > request.allowance.loadoutSlotCount) {
    reasons.push(`Mission allows ${request.allowance.loadoutSlotCount} loadout slot(s)`);
  }
  const selectedLoadouts = selectedLoadoutIds.flatMap((id) => {
    const loadout = request.profile.loadouts[id];
    if (!loadout) {
      reasons.push(`Loadout '${id}' no longer exists`);
      return [];
    }
    return [loadout];
  });
  const purchased = new Set([...request.profile.purchasedUpgradeIds, ...request.profile.permanentUpgradeIds]);
  const upgradeIds = uniqueSorted(selectedLoadouts.flatMap((loadout) => loadout.upgradeIds)).filter((id) => {
    const allowed = purchased.has(id) && registry.getUpgrade(id) !== undefined;
    if (!allowed) reasons.push(`Upgrade '${id}' is not purchased or registered`);
    return allowed;
  });
  const allowedUnlocks = request.allowance.allowedUnlockIds
    ? new Set(request.allowance.allowedUnlockIds.map(String))
    : undefined;
  const deniedUnlocks = new Set((request.allowance.deniedUnlockIds ?? []).map(String));
  const profileUnlocks = new Set(request.profile.unlockIds);
  const maximumChapterIndex = request.allowance.maxStoryChapter
    ? CHAPTER_ORDER.indexOf(request.allowance.maxStoryChapter)
    : Number.POSITIVE_INFINITY;
  const unlockIds = uniqueSorted(selectedLoadouts.flatMap((loadout) => loadout.unlockIds)).filter((id) => {
    const definition = registry.getUnlock(id);
    const chapterAllowed = !definition?.chapterId || CHAPTER_ORDER.indexOf(definition.chapterId) <= maximumChapterIndex;
    const allowed =
      profileUnlocks.has(id) && !deniedUnlocks.has(id) && (!allowedUnlocks || allowedUnlocks.has(id)) && chapterAllowed;
    if (!allowed) reasons.push(`Unlock '${id}' is disabled by this mission`);
    return allowed;
  });
  const inventoryIds = new Set(request.profile.inventory.map((item) => item.id));
  const inventoryItemIds = uniqueSorted(selectedLoadouts.flatMap((loadout) => loadout.inventoryItemIds)).filter(
    (id) => {
      const allowed = inventoryIds.has(id);
      if (!allowed) reasons.push(`Inventory item '${id}' is unavailable`);
      return allowed;
    }
  );
  const itemModifiers = inventoryItemIds.flatMap((id) => {
    const item = request.profile.inventory.find((candidate) => candidate.id === id);
    return item ? (registry.getItem(item.definitionId)?.modifiers ?? []) : [];
  });
  const boostModifiers = uniqueSorted(request.temporaryBoostIds ?? []).flatMap(
    (id) => registry.getTemporaryBoost(id)?.modifiers ?? []
  );
  const upgradeModifiers = upgradeIds.flatMap((id) => {
    const upgrade = registry.getUpgrade(id);
    if (!upgrade) return [];
    const hero = upgrade.scope.kind === "hero" ? registry.getHero(upgrade.scope.heroId) : undefined;
    const scope =
      upgrade.scope.kind === "hero"
        ? hero
          ? { kind: "actor" as const, objectName: hero.actorName }
          : { kind: "global" as const }
        : upgrade.scope;
    return upgrade.modifiers.map((modifier) => ({ ...modifier, scope }));
  });

  return {
    selectedLoadoutIds,
    upgradeIds,
    unlockIds,
    inventoryItemIds,
    modifiers: capCampaignProgressionModifiers([...upgradeModifiers, ...itemModifiers, ...boostModifiers]),
    unitLevelCaps: {
      ...Object.fromEntries((request.allowance.unitLevelCaps ?? []).map((cap) => [cap.objectName, cap.maximumLevel])),
      ...request.allowance.maxUnitLevels
    },
    restrictionReasons: uniqueSorted(reasons)
  };
}

/** Collapses modifier stacks and enforces the narrow cadence/pathing caps required by campaign progression. */
export function capCampaignProgressionModifiers(
  modifiers: readonly CampaignProgressionModifier[]
): readonly CampaignProgressionModifier[] {
  const byStat = new Map<string, { modifier: CampaignProgressionModifier; add: number; multiply: number }>();
  for (const modifier of modifiers) {
    if (!Number.isFinite(modifier.value)) continue;
    const key = `${modifier.stat}:${JSON.stringify(modifier.scope ?? { kind: "global" })}`;
    const aggregate = byStat.get(key) ?? { modifier, add: 0, multiply: 1 };
    if (modifier.operation === "add") aggregate.add += modifier.value;
    else aggregate.multiply *= modifier.value;
    byStat.set(key, aggregate);
  }
  const result: CampaignProgressionModifier[] = [];
  for (const key of [...byStat.keys()].sort()) {
    const aggregate = byStat.get(key);
    if (!aggregate) continue;
    const stat = aggregate.modifier.stat;
    const scope = aggregate.modifier.scope;
    if (aggregate.add !== 0) result.push({ stat, operation: "add", value: aggregate.add, ...(scope ? { scope } : {}) });
    let multiplier = aggregate.multiply;
    if (stat === "movement-speed") {
      multiplier = Math.max(MOVEMENT_SPEED_MULTIPLIER_FLOOR, Math.min(multiplier, MOVEMENT_SPEED_MULTIPLIER_CAP));
    }
    if (stat === "cooldown") {
      multiplier = Math.max(COOLDOWN_MULTIPLIER_FLOOR, Math.min(multiplier, COOLDOWN_MULTIPLIER_CAP));
    }
    if (multiplier !== 1) {
      result.push({ stat, operation: "multiply", value: multiplier, ...(scope ? { scope } : {}) });
    }
  }
  return result;
}

function uniqueSorted<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function cloneProgressionProfile(profile: CampaignProgressionProfile): CampaignProgressionProfile {
  return structuredClone(profile);
}
