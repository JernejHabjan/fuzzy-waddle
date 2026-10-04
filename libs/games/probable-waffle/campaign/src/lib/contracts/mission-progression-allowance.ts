import type { CampaignChapterId, ObjectNames, ResearchType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { CampaignUnlockId } from "./campaign-content-id";

/**
 * Defines the structured mission unit level cap contract for this module. Its declared surface makes object
 * name, maximum level explicit to every consumer. Use this shared shape rather than an ad-hoc object so
 * adapters, persistence, and callers remain compatible.
 */
export interface MissionUnitLevelCap {
  /**
   * human-facing object name for {@link MissionUnitLevelCap}. It supports UI, narration, or diagnostics and must
   * not be used as the stable identity of the record.
   */
  readonly objectName: ObjectNames;
  /**
   * numeric maximum level carried by {@link MissionUnitLevelCap}. Its units and valid range are defined by
   * {@link MissionUnitLevelCap} and must remain consistent across producers and consumers.
   */
  readonly maximumLevel: number;
}

/**
 * Defines the structured mission progression allowance contract for this module. Its declared surface makes
 * max story chapter, allowed unlock ids, denied unlock ids, allowed actor ids, denied actor ids explicit to
 * every consumer. Use this shared shape rather than an ad-hoc object so adapters, persistence, and callers
 * remain compatible.
 */
export interface MissionProgressionAllowance {
  /**
   * Optional max story chapter value carried by {@link MissionProgressionAllowance}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  readonly maxStoryChapter?: CampaignChapterId;
  /**
   * Optional boolean policy/value on {@link MissionProgressionAllowance} that explicitly controls whether the
   * associated behavior is active; do not infer it from unrelated state.
   */
  readonly allowedUnlockIds?: readonly CampaignUnlockId[];
  /**
   * Optional collection owned by {@link MissionProgressionAllowance}. Preserve the declared element contract and
   * any ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly deniedUnlockIds?: readonly CampaignUnlockId[];
  /**
   * Optional boolean policy/value on {@link MissionProgressionAllowance} that explicitly controls whether the
   * associated behavior is active; do not infer it from unrelated state.
   */
  readonly allowedActorIds?: readonly ObjectNames[];
  /**
   * Optional collection owned by {@link MissionProgressionAllowance}. Preserve the declared element contract and
   * any ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly deniedActorIds?: readonly ObjectNames[];
  /**
   * Optional boolean policy/value on {@link MissionProgressionAllowance} that explicitly controls whether the
   * associated behavior is active; do not infer it from unrelated state.
   */
  readonly allowedResearchIds?: readonly ResearchType[];
  /**
   * Optional collection owned by {@link MissionProgressionAllowance}. Preserve the declared element contract and
   * any ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly deniedResearchIds?: readonly ResearchType[];
  /**
   * Optional collection value on {@link MissionProgressionAllowance}. Its element type defines the records that
   * may cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly unitLevelCaps?: readonly MissionUnitLevelCap[];
  /**
   * Optional max unit levels value carried by {@link MissionProgressionAllowance}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  readonly maxUnitLevels?: Readonly<Partial<Record<ObjectNames, number>>>;
  /**
   * numeric bound or quantity carried by {@link MissionProgressionAllowance}. Interpret it in the owning
   * contract’s units and preserve its validation constraints at boundaries.
   */
  readonly loadoutSlotCount: number;
}
