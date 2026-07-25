import {
  type CampaignId,
  type CampaignMissionId,
  isCampaignChapterId,
  isCampaignId,
  isCampaignMissionId
} from "@fuzzy-waddle/probable-waffle-protocol";
import type { CampaignDefinition } from "../contracts/campaign-definition";
import type { CampaignMissionContent } from "../contracts/campaign-mission-content";
import type { MissionDialogueBundle } from "../contracts/mission-dialogue-bundle";
import type { MissionRewardBundle } from "../contracts/mission-reward-bundle";

interface RawCampaignEnvelope {
  readonly schemaVersion?: unknown;
  readonly id?: unknown;
  readonly catalogueVersion?: unknown;
  readonly chapters?: unknown;
}

interface RawMissionEnvelope {
  readonly schemaVersion?: unknown;
  readonly id?: unknown;
  readonly chapterId?: unknown;
  readonly revision?: unknown;
}

interface RawMissionBundleEnvelope {
  readonly schemaVersion?: unknown;
  readonly missionId?: unknown;
}

function requireObject(value: unknown, sourcePath: string): object {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${sourcePath}: expected a JSON object`);
  }
  return value;
}

/** Performs only cheap identity/version checks; complete schema validation belongs in tests and CI. */
export function loadCampaignDefinition(value: unknown, sourcePath: string): CampaignDefinition {
  const raw = requireObject(value, sourcePath) as RawCampaignEnvelope;
  if (raw.schemaVersion !== 1) throw new Error(`${sourcePath}: unsupported campaign schemaVersion`);
  if (typeof raw.id !== "string" || !isCampaignId(raw.id)) throw new Error(`${sourcePath}: invalid campaign id`);
  if (!Number.isInteger(raw.catalogueVersion) || Number(raw.catalogueVersion) < 1) {
    throw new Error(`${sourcePath}: invalid catalogueVersion`);
  }
  if (!Array.isArray(raw.chapters)) throw new Error(`${sourcePath}: chapters must be an array`);
  return value as CampaignDefinition;
}

export function loadMissionContent(value: unknown, sourcePath: string): CampaignMissionContent {
  const raw = requireObject(value, sourcePath) as RawMissionEnvelope;
  if (raw.schemaVersion !== 1) throw new Error(`${sourcePath}: unsupported mission schemaVersion`);
  if (typeof raw.id !== "string" || !isCampaignMissionId(raw.id)) throw new Error(`${sourcePath}: invalid mission id`);
  if (typeof raw.chapterId !== "string" || !isCampaignChapterId(raw.chapterId)) {
    throw new Error(`${sourcePath}: invalid chapter id`);
  }
  if (!Number.isInteger(raw.revision) || Number(raw.revision) < 1) throw new Error(`${sourcePath}: invalid revision`);
  return value as CampaignMissionContent;
}

export function loadDialogueBundle(value: unknown, sourcePath: string): MissionDialogueBundle {
  return loadMissionBundle(value, sourcePath, "dialogue") as MissionDialogueBundle;
}

export function loadRewardBundle(value: unknown, sourcePath: string): MissionRewardBundle {
  return loadMissionBundle(value, sourcePath, "reward") as MissionRewardBundle;
}

function loadMissionBundle(
  value: unknown,
  sourcePath: string,
  bundleKind: "dialogue" | "reward"
): MissionDialogueBundle | MissionRewardBundle {
  const raw = requireObject(value, sourcePath) as RawMissionBundleEnvelope;
  if (raw.schemaVersion !== 1) throw new Error(`${sourcePath}: unsupported ${bundleKind} schemaVersion`);
  if (typeof raw.missionId !== "string" || !isCampaignMissionId(raw.missionId)) {
    throw new Error(`${sourcePath}: invalid ${bundleKind} mission id`);
  }
  return value as MissionDialogueBundle | MissionRewardBundle;
}

export function assertContentIdentity(
  campaignId: CampaignId,
  missionId: CampaignMissionId,
  mission: CampaignMissionContent
): void {
  if (campaignId !== "ashes-of-the-ancients" || mission.id !== missionId) {
    throw new Error(`Campaign content identity mismatch for ${campaignId}/${missionId}`);
  }
}
