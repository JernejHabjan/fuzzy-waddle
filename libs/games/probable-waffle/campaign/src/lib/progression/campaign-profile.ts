import {
  CAMPAIGN_MISSION_IDS,
  type CampaignDifficulty,
  type CampaignMissionCompletion,
  type CampaignMissionId,
  type CampaignMissionMastery,
  type CampaignLoadout,
  type CampaignProfile,
  type CampaignProfileData,
  type CampaignProgressionProfile,
  type CampaignVictoryCommitRequest,
  type FactionType
} from "@fuzzy-waddle/probable-waffle-protocol";
import type { CampaignProgressionRegistry } from "../registry/campaign-progression-registry";
import { createInitialCampaignProgressionProfile } from "./campaign-progression-resolver";

export function createInitialCampaignProfile(registry: CampaignProgressionRegistry): CampaignProfile {
  return {
    schemaVersion: 1,
    progression: createInitialCampaignProgressionProfile(registry),
    activeLoadoutIds: [],
    seenCinematicIds: [],
    committedRunIds: [],
    missionMastery: {}
  };
}

export function campaignLoadoutSnapshotHash(
  profileRevision: number,
  selectedLoadoutIds: readonly string[]
): string {
  const value = `${profileRevision}:${uniqueSorted(selectedLoadoutIds).join(",")}`;
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) hash = (hash * 33) ^ value.charCodeAt(index);
  return (hash >>> 0).toString(16).padStart(8, "0");
}

/** Deterministically combines guest and remote ownership without adding balances or completion counts twice. */
export function mergeCampaignProfileData(left: CampaignProfileData, right: CampaignProfileData): CampaignProfileData {
  return {
    profile: mergeCampaignProfiles(left.profile, right.profile),
    completedMissions: mergeCompletions(left.completedMissions, right.completedMissions)
  };
}

export function applyCampaignMissionMastery(
  profile: CampaignProfile,
  request: CampaignVictoryCommitRequest,
  completedAt: string,
  durationSeconds?: number
): CampaignProfile {
  if (request.outcome !== "victory") return profile;
  const current = profile.missionMastery[request.missionId];
  const next: CampaignMissionMastery = {
    firstCompletedAt:
      current && current.firstCompletedAt < completedAt ? current.firstCompletedAt : completedAt,
    completionCount: (current?.completionCount ?? 0) + 1,
    bestDifficulty: harderDifficulty(current?.bestDifficulty, request.difficulty),
    ...(bestDuration(current?.bestDurationSeconds, durationSeconds) !== undefined
      ? { bestDurationSeconds: bestDuration(current?.bestDurationSeconds, durationSeconds) }
      : {}),
    completedObjectiveIds: uniqueSorted([
      ...(current?.completedObjectiveIds ?? []),
      ...request.completedObjectiveIds
    ])
  };
  return { ...profile, missionMastery: { ...profile.missionMastery, [request.missionId]: next } };
}

export function profileDataFromLegacyCompletions(
  completions: readonly CampaignMissionCompletion[],
  registry: CampaignProgressionRegistry
): CampaignProfileData {
  return {
    profile: createInitialCampaignProfile(registry),
    completedMissions: mergeCompletions(completions, [])
  };
}

export function isCampaignProfile(value: unknown): value is CampaignProfile {
  if (!value || typeof value !== "object") return false;
  const profile = value as Partial<CampaignProfile>;
  const progression = profile.progression;
  return (
    profile.schemaVersion === 1 &&
    Boolean(progression) &&
    progression?.schemaVersion === 1 &&
    Number.isSafeInteger(progression.revision) &&
    Boolean(progression.wallet) &&
    typeof progression.wallet?.balances === "object" &&
    Array.isArray(progression.discoveredUpgradeIds) &&
    Array.isArray(progression.permanentUpgradeIds) &&
    Array.isArray(progression.purchasedUpgradeIds) &&
    Array.isArray(progression.unlockIds) &&
    Boolean(progression.heroProgress) &&
    Boolean(progression.factionProgress) &&
    Boolean(progression.loadouts) &&
    Array.isArray(progression.inventory) &&
    Array.isArray(progression.rewardClaimIds) &&
    Array.isArray(profile.activeLoadoutIds) &&
    Array.isArray(profile.seenCinematicIds) &&
    Array.isArray(profile.committedRunIds) &&
    Boolean(profile.missionMastery) &&
    typeof profile.missionMastery === "object"
  );
}

function mergeCampaignProfiles(left: CampaignProfile, right: CampaignProfile): CampaignProfile {
  return {
    schemaVersion: 1,
    progression: mergeProgression(left.progression, right.progression),
    activeLoadoutIds: uniqueSorted([...left.activeLoadoutIds, ...right.activeLoadoutIds]),
    seenCinematicIds: uniqueSorted([...left.seenCinematicIds, ...right.seenCinematicIds]),
    committedRunIds: uniqueSorted([...left.committedRunIds, ...right.committedRunIds]),
    missionMastery: mergeMastery(left.missionMastery, right.missionMastery)
  };
}

function mergeProgression(
  left: CampaignProgressionProfile,
  right: CampaignProgressionProfile
): CampaignProgressionProfile {
  const inventory = new Map(right.inventory.map((item) => [item.id, { ...item }]));
  for (const item of left.inventory) {
    const current = inventory.get(item.id);
    if (
      !current ||
      item.quantity > current.quantity ||
      (item.quantity === current.quantity && JSON.stringify(item) < JSON.stringify(current))
    ) {
      inventory.set(item.id, { ...item });
    }
  }
  return {
    ...right,
    revision: Math.max(left.revision, right.revision),
    wallet: {
      balances: mergeNumberMax(left.wallet.balances, right.wallet.balances)
    },
    discoveredUpgradeIds: uniqueSorted([...left.discoveredUpgradeIds, ...right.discoveredUpgradeIds]),
    permanentUpgradeIds: uniqueSorted([...left.permanentUpgradeIds, ...right.permanentUpgradeIds]),
    purchasedUpgradeIds: uniqueSorted([...left.purchasedUpgradeIds, ...right.purchasedUpgradeIds]),
    unlockIds: uniqueSorted([...left.unlockIds, ...right.unlockIds]),
    heroProgress: mergeHeroProgress(left.heroProgress, right.heroProgress),
    factionProgress: mergeFactionProgress(left.factionProgress, right.factionProgress),
    loadouts: mergeLoadouts(left.loadouts, right.loadouts),
    inventory: [...inventory.values()].sort((a, b) => a.id.localeCompare(b.id)),
    rewardClaimIds: uniqueSorted([...left.rewardClaimIds, ...right.rewardClaimIds])
  };
}

function mergeLoadouts(
  left: CampaignProgressionProfile["loadouts"],
  right: CampaignProgressionProfile["loadouts"]
): CampaignProgressionProfile["loadouts"] {
  const entries: Array<[string, CampaignLoadout]> = [];
  for (const id of uniqueSorted([...Object.keys(left), ...Object.keys(right)])) {
    const a = left[id];
    const b = right[id];
    if (!a && !b) continue;
    const selected = !a || !b ? (a ?? b) : JSON.stringify(a) <= JSON.stringify(b) ? a : b;
    if (selected) entries.push([id, structuredClone(selected)]);
  }
  return Object.fromEntries(entries);
}

function mergeCompletions(
  left: readonly CampaignMissionCompletion[],
  right: readonly CampaignMissionCompletion[]
): CampaignMissionCompletion[] {
  const completions = new Map<CampaignMissionId, string>();
  for (const completion of [...left, ...right]) {
    if (!(CAMPAIGN_MISSION_IDS as readonly string[]).includes(completion.missionId)) continue;
    if (Number.isNaN(Date.parse(completion.completedAt))) continue;
    const current = completions.get(completion.missionId);
    if (!current || completion.completedAt < current) completions.set(completion.missionId, completion.completedAt);
  }
  return [...completions]
    .sort((a, b) => CAMPAIGN_MISSION_IDS.indexOf(a[0]) - CAMPAIGN_MISSION_IDS.indexOf(b[0]))
    .map(([missionId, completedAt]) => ({ missionId, completedAt }));
}

function mergeMastery(
  left: CampaignProfile["missionMastery"],
  right: CampaignProfile["missionMastery"]
): CampaignProfile["missionMastery"] {
  const result: Partial<Record<CampaignMissionId, CampaignMissionMastery>> = {};
  for (const missionId of CAMPAIGN_MISSION_IDS) {
    const a = left[missionId];
    const b = right[missionId];
    if (!a && !b) continue;
    if (!a || !b) {
      const only = a ?? b;
      if (only) result[missionId] = structuredClone(only);
      continue;
    }
    result[missionId] = {
      firstCompletedAt: a.firstCompletedAt < b.firstCompletedAt ? a.firstCompletedAt : b.firstCompletedAt,
      completionCount: Math.max(a.completionCount, b.completionCount),
      bestDifficulty: harderDifficulty(a.bestDifficulty, b.bestDifficulty),
      ...(bestDuration(a.bestDurationSeconds, b.bestDurationSeconds) !== undefined
        ? { bestDurationSeconds: bestDuration(a.bestDurationSeconds, b.bestDurationSeconds) }
        : {}),
      completedObjectiveIds: uniqueSorted([...a.completedObjectiveIds, ...b.completedObjectiveIds])
    };
  }
  return result;
}

function mergeHeroProgress(
  left: CampaignProgressionProfile["heroProgress"],
  right: CampaignProgressionProfile["heroProgress"]
): CampaignProgressionProfile["heroProgress"] {
  const ids = uniqueSorted([...Object.keys(left), ...Object.keys(right)]);
  return Object.fromEntries(
    ids.map((id) => [
      id,
      {
        upgradeIds: uniqueSorted([...(left[id]?.upgradeIds ?? []), ...(right[id]?.upgradeIds ?? [])]),
        storySkillUnlockIds: uniqueSorted([
          ...(left[id]?.storySkillUnlockIds ?? []),
          ...(right[id]?.storySkillUnlockIds ?? [])
        ])
      }
    ])
  );
}

function mergeFactionProgress(
  left: CampaignProgressionProfile["factionProgress"],
  right: CampaignProgressionProfile["factionProgress"]
): CampaignProgressionProfile["factionProgress"] {
  const ids = uniqueSorted([...Object.keys(left), ...Object.keys(right)]);
  return Object.fromEntries(
    ids.map((id) => {
      const faction = Number(id) as FactionType;
      return [
        id,
        { upgradeIds: uniqueSorted([...(left[faction]?.upgradeIds ?? []), ...(right[faction]?.upgradeIds ?? [])]) }
      ];
    })
  );
}

function mergeNumberMax(
  left: Readonly<Record<string, number>>,
  right: Readonly<Record<string, number>>
): Readonly<Record<string, number>> {
  return Object.fromEntries(
    uniqueSorted([...Object.keys(left), ...Object.keys(right)]).map((id) => [
      id,
      Math.max(0, left[id] ?? 0, right[id] ?? 0)
    ])
  );
}

function bestDuration(left: number | undefined, right: number | undefined): number | undefined {
  if (left === undefined) return right;
  if (right === undefined) return left;
  return Math.min(left, right);
}

function harderDifficulty(left: CampaignDifficulty | undefined, right: CampaignDifficulty): CampaignDifficulty {
  const rank: Record<CampaignDifficulty, number> = { story: 0, normal: 1, hard: 2 };
  return left && rank[left] >= rank[right] ? left : right;
}

function uniqueSorted<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}
