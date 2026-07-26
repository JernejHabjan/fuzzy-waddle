import type {
  CampaignArtworkDefinition,
  CampaignChapterId,
  CampaignId,
  CampaignMissionId,
  CampaignMissionLayout
} from "@fuzzy-waddle/probable-waffle-protocol";

/**
 * Defines the structured campaign content chapter definition contract for this module. Its declared surface
 * makes id, order, title, subtitle, summary explicit to every consumer. Use this shared shape rather than an
 * ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignContentChapterDefinition {
  /**
   * stable id used by {@link CampaignContentChapterDefinition} to correlate this value with related records,
   * events, or authored content; it is not a display label.
   */
  readonly id: CampaignChapterId;
  /**
   * numeric order carried by {@link CampaignContentChapterDefinition}. Its units and valid range are defined by
   * {@link CampaignContentChapterDefinition} and must remain consistent across producers and consumers.
   */
  readonly order: number;
  /**
   * human-facing title for {@link CampaignContentChapterDefinition}. It supports UI, narration, or diagnostics
   * and must not be used as the stable identity of the record.
   */
  readonly title: string;
  /**
   * human-facing subtitle for {@link CampaignContentChapterDefinition}. It supports UI, narration, or
   * diagnostics and must not be used as the stable identity of the record.
   */
  readonly subtitle: string;
  /**
   * human-facing summary for {@link CampaignContentChapterDefinition}. It supports UI, narration, or diagnostics
   * and must not be used as the stable identity of the record.
   */
  readonly summary: string;
  /**
   * presentation metadata for {@link CampaignContentChapterDefinition}. Rendering adapters consume it locally;
   * deterministic identity and behavior remain owned by the linked contract fields.
   */
  readonly layout: CampaignMissionLayout;
  /**
   * presentation metadata for {@link CampaignContentChapterDefinition}. Rendering adapters consume it locally;
   * deterministic identity and behavior remain owned by the linked contract fields.
   */
  readonly artwork: CampaignArtworkDefinition;
  /**
   * presentation metadata for {@link CampaignContentChapterDefinition}. Rendering adapters consume it locally;
   * deterministic identity and behavior remain owned by the linked contract fields.
   */
  readonly missionArtwork: CampaignArtworkDefinition;
  /**
   * collection owned by {@link CampaignContentChapterDefinition}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly missionIds: readonly CampaignMissionId[];
}

/**
 * Defines the structured campaign definition contract for this module. Its declared surface makes schema
 * version, id, catalogue version, chapters explicit to every consumer. Use this shared shape rather than an
 * ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignDefinition {
  /**
   * compatibility schema version for {@link CampaignDefinition}. Consumers use it to choose validation,
   * migration, or conflict-handling rules instead of guessing the payload shape.
   */
  readonly schemaVersion: 1;
  /**
   * stable id used by {@link CampaignDefinition} to correlate this value with related records, events, or
   * authored content; it is not a display label.
   */
  readonly id: CampaignId;
  /**
   * compatibility catalogue version for {@link CampaignDefinition}. Consumers use it to choose validation,
   * migration, or conflict-handling rules instead of guessing the payload shape.
   */
  readonly catalogueVersion: number;
  /**
   * collection value on {@link CampaignDefinition}. Its element type defines the records that may cross this
   * boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly chapters: readonly CampaignContentChapterDefinition[];
}
