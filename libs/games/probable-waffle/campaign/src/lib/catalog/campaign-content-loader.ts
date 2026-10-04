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

/**
 * Defines the structured raw campaign envelope contract for this module. Its declared surface makes schema
 * version, id, catalogue version, chapters explicit to every consumer. Use this shared shape rather than an
 * ad-hoc object so adapters, persistence, and callers remain compatible.
 */
interface RawCampaignEnvelope {
  /**
   * Optional compatibility schema version for {@link RawCampaignEnvelope}. Consumers use it to choose
   * validation, migration, or conflict-handling rules instead of guessing the payload shape.
   */
  readonly schemaVersion?: unknown;
  /**
   * Optional stable id used by {@link RawCampaignEnvelope} to correlate this value with related records, events,
   * or authored content; it is not a display label.
   */
  readonly id?: unknown;
  /**
   * Optional compatibility catalogue version for {@link RawCampaignEnvelope}. Consumers use it to choose
   * validation, migration, or conflict-handling rules instead of guessing the payload shape.
   */
  readonly catalogueVersion?: unknown;
  /**
   * Optional chapters value carried by {@link RawCampaignEnvelope}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly chapters?: unknown;
}

/**
 * Defines the structured raw mission envelope contract for this module. Its declared surface makes schema
 * version, id, chapter id, revision explicit to every consumer. Use this shared shape rather than an ad-hoc
 * object so adapters, persistence, and callers remain compatible.
 */
interface RawMissionEnvelope {
  /**
   * Optional compatibility schema version for {@link RawMissionEnvelope}. Consumers use it to choose validation,
   * migration, or conflict-handling rules instead of guessing the payload shape.
   */
  readonly schemaVersion?: unknown;
  /**
   * Optional stable id used by {@link RawMissionEnvelope} to correlate this value with related records, events,
   * or authored content; it is not a display label.
   */
  readonly id?: unknown;
  /**
   * Optional stable chapter id used by {@link RawMissionEnvelope} to correlate this value with related records,
   * events, or authored content; it is not a display label.
   */
  readonly chapterId?: unknown;
  /**
   * Optional compatibility revision for {@link RawMissionEnvelope}. Consumers use it to choose validation,
   * migration, or conflict-handling rules instead of guessing the payload shape.
   */
  readonly revision?: unknown;
}

/**
 * Defines the structured raw mission bundle envelope contract for this module. Its declared surface makes
 * schema version, mission id explicit to every consumer. Use this shared shape rather than an ad-hoc object so
 * adapters, persistence, and callers remain compatible.
 */
interface RawMissionBundleEnvelope {
  /**
   * Optional compatibility schema version for {@link RawMissionBundleEnvelope}. Consumers use it to choose
   * validation, migration, or conflict-handling rules instead of guessing the payload shape.
   */
  readonly schemaVersion?: unknown;
  /**
   * Optional stable mission id used by {@link RawMissionBundleEnvelope} to correlate this value with related
   * records, events, or authored content; it is not a display label.
   */
  readonly missionId?: unknown;
}

function requireObject(value: unknown, sourcePath: string): object {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${sourcePath}: expected a JSON object`);
  }
  return value;
}

/** Documents the load campaign definition member and its declared contract at this boundary. */
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
