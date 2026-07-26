import type {
  MissionActionId,
  MissionCinematicId,
  MissionDialogueLineId,
  MissionPortraitId,
  MissionSpeakerId,
  MissionTextId,
  ScenarioActorId,
  ScenarioCameraShotId,
  ScenarioPointId
} from "./campaign-content-id";
import type { CampaignMissionId } from "@fuzzy-waddle/probable-waffle-protocol";
import type { CampaignCinematicKind } from "./campaign-content-kinds";
import type { MissionActionDefinition } from "./mission-action-definition";

/**
 * Defines the structured mission speaker definition contract for this module. Its declared surface makes id,
 * name text id, portrait id explicit to every consumer. Use this shared shape rather than an ad-hoc object so
 * adapters, persistence, and callers remain compatible.
 */
export interface MissionSpeakerDefinition {
  /**
   * stable id used by {@link MissionSpeakerDefinition} to correlate this value with related records, events, or
   * authored content; it is not a display label.
   */
  readonly id: MissionSpeakerId;
  /**
   * stable name text id used by {@link MissionSpeakerDefinition} to correlate this value with related records,
   * events, or authored content; it is not a display label.
   */
  readonly nameTextId: MissionTextId;
  /**
   * Optional stable portrait id used by {@link MissionSpeakerDefinition} to correlate this value with related
   * records, events, or authored content; it is not a display label.
   */
  readonly portraitId?: MissionPortraitId;
}

/**
 * Defines the structured mission portrait definition contract for this module. Its declared surface makes id,
 * texture key, frame, speaking animation key explicit to every consumer. Use this shared shape rather than an
 * ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface MissionPortraitDefinition {
  /**
   * stable id used by {@link MissionPortraitDefinition} to correlate this value with related records, events, or
   * authored content; it is not a display label.
   */
  readonly id: MissionPortraitId;
  /**
   * stable texture key used by {@link MissionPortraitDefinition} to correlate this value with related records,
   * events, or authored content; it is not a display label.
   */
  readonly textureKey: string;
  /**
   * Optional frame value carried by {@link MissionPortraitDefinition}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly frame?: string | number;
  /**
   * Optional stable speaking animation key used by {@link MissionPortraitDefinition} to correlate this value
   * with related records, events, or authored content; it is not a display label.
   */
  readonly speakingAnimationKey?: string;
}

/**
 * Defines the structured mission text definition contract for this module. Its declared surface makes id, text
 * explicit to every consumer. Use this shared shape rather than an ad-hoc object so adapters, persistence, and
 * callers remain compatible.
 */
export interface MissionTextDefinition {
  /**
   * stable id used by {@link MissionTextDefinition} to correlate this value with related records, events, or
   * authored content; it is not a display label.
   */
  readonly id: MissionTextId;
  /**
   * human-facing text for {@link MissionTextDefinition}. It supports UI, narration, or diagnostics and must not
   * be used as the stable identity of the record.
   */
  readonly text: string;
}

/**
 * Defines the structured mission dialogue line contract for this module. Its declared surface makes id,
 * speaker id, text id, text, audio asset key explicit to every consumer. Use this shared shape rather than an
 * ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface MissionDialogueLine {
  /**
   * stable id used by {@link MissionDialogueLine} to correlate this value with related records, events, or
   * authored content; it is not a display label.
   */
  readonly id: MissionDialogueLineId;
  /**
   * stable speaker id used by {@link MissionDialogueLine} to correlate this value with related records, events,
   * or authored content; it is not a display label.
   */
  readonly speakerId: MissionSpeakerId;
  /**
   * stable text id used by {@link MissionDialogueLine} to correlate this value with related records, events, or
   * authored content; it is not a display label.
   */
  readonly textId: MissionTextId;
  /**
   * human-facing text for {@link MissionDialogueLine}. It supports UI, narration, or diagnostics and must not be
   * used as the stable identity of the record.
   */
  readonly text: string;
  /**
   * Optional stable audio asset key used by {@link MissionDialogueLine} to correlate this value with related
   * records, events, or authored content; it is not a display label.
   */
  readonly audioAssetKey?: string;
  /**
   * Optional stable portrait id used by {@link MissionDialogueLine} to correlate this value with related
   * records, events, or authored content; it is not a display label.
   */
  readonly portraitId?: MissionPortraitId;
  /**
   * delivery value carried by {@link MissionDialogueLine}. Its declared type is the compatibility boundary for
   * producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly delivery: "blocking" | "non-blocking" | "ambient" | "tutorial";
  /**
   * Optional numeric minimum ticks carried by {@link MissionDialogueLine}. Its units and valid range are defined
   * by {@link MissionDialogueLine} and must remain consistent across producers and consumers.
   */
  readonly minimumTicks?: number;
}

/**
 * Defines the closed mission presentation cue value set. Keeping this union named preserves exhaustive
 * handling and prevents incompatible free-form values at its boundaries.
 */
export type MissionPresentationCue =
  | { readonly kind: "dialogue"; readonly lineId: MissionDialogueLineId }
  | { readonly kind: "wait"; readonly durationTicks: number }
  | { readonly kind: "letterbox"; readonly visible: boolean }
  | { readonly kind: "title"; readonly textId: MissionTextId }
  | {
      readonly kind: "camera-shot";
      readonly shotId: ScenarioCameraShotId;
      readonly fallbackPointId?: ScenarioPointId;
      readonly durationTicks?: number;
    }
  | {
      readonly kind: "camera-actor";
      readonly actorId: ScenarioActorId;
      readonly fallbackPointId?: ScenarioPointId;
      readonly durationTicks?: number;
    }
  | { readonly kind: "audio"; readonly assetKey: string; readonly waitForCompletion?: boolean }
  | { readonly kind: "ui-suppression"; readonly suppressed: boolean }
  | { readonly kind: "actor-animation"; readonly actorId: ScenarioActorId; readonly animationKey: string };

/**
 * Defines the structured mission cinematic definition base contract for this module. Its declared surface
 * makes id, mode, seen skip policy, lock player control, lock camera explicit to every consumer. Use this
 * shared shape rather than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
interface MissionCinematicDefinitionBase {
  /**
   * stable id used by {@link MissionCinematicDefinitionBase} to correlate this value with related records,
   * events, or authored content; it is not a display label.
   */
  readonly id: MissionCinematicId;
  /**
   * discriminator for {@link MissionCinematicDefinitionBase}. It selects the valid branch and behavior, so
   * producers and consumers must keep it synchronized with the accompanying fields.
   */
  readonly mode: CampaignCinematicKind;
  /**
   * discriminator for {@link MissionCinematicDefinitionBase}. It selects the valid branch and behavior, so
   * producers and consumers must keep it synchronized with the accompanying fields.
   */
  readonly seenSkipPolicy: "hold" | "tap";
  /**
   * Optional lock player control value carried by {@link MissionCinematicDefinitionBase}. Its declared type is
   * the compatibility boundary for producers, validators, and consumers; do not replace it with a broader
   * inferred shape.
   */
  readonly lockPlayerControl?: boolean;
  /**
   * Optional lock camera value carried by {@link MissionCinematicDefinitionBase}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  readonly lockCamera?: boolean;
  /**
   * Optional collection value on {@link MissionCinematicDefinitionBase}. Its element type defines the records
   * that may cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly resumeCueIndexes?: readonly number[];
  /**
   * Optional numeric fallback timeout ticks carried by {@link MissionCinematicDefinitionBase}. Its units and
   * valid range are defined by {@link MissionCinematicDefinitionBase} and must remain consistent across
   * producers and consumers.
   */
  readonly fallbackTimeoutTicks?: number;
  /**
   * collection value on {@link MissionCinematicDefinitionBase}. Its element type defines the records that may
   * cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly timeline: readonly MissionPresentationCue[];
  /**
   * Optional collection value on {@link MissionCinematicDefinitionBase}. Its element type defines the records
   * that may cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly gameplayPrelude?: readonly MissionActionDefinition[];
  /** Documents the gameplay prelude action ids member and its declared contract at this boundary. */
  readonly gameplayPreludeActionIds?: readonly MissionActionId[];
}

/**
 * Defines the mission cinematic definition alias used by this module. Keep values in this named domain so
 * linked APIs and storage boundaries do not drift into an unconstrained primitive.
 */
export type MissionCinematicDefinition = MissionCinematicDefinitionBase &
  (
    | {
        readonly gameplayFinalize: readonly MissionActionDefinition[];
        /** Documents the gameplay finalize action ids member and its declared contract at this boundary. */
        readonly gameplayFinalizeActionIds?: readonly MissionActionId[];
      }
    | {
        readonly gameplayFinalize?: undefined;
        /** Documents the gameplay finalize action ids member and its declared contract at this boundary. */
        readonly gameplayFinalizeActionIds: readonly MissionActionId[];
      }
  );

/**
 * Defines the structured mission dialogue bundle contract for this module. Its declared surface makes schema
 * version, mission id, texts, portraits, speakers explicit to every consumer. Use this shared shape rather
 * than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface MissionDialogueBundle {
  /**
   * compatibility schema version for {@link MissionDialogueBundle}. Consumers use it to choose validation,
   * migration, or conflict-handling rules instead of guessing the payload shape.
   */
  readonly schemaVersion: 1;
  /**
   * stable mission id used by {@link MissionDialogueBundle} to correlate this value with related records,
   * events, or authored content; it is not a display label.
   */
  readonly missionId: CampaignMissionId;
  /**
   * Optional collection value on {@link MissionDialogueBundle}. Its element type defines the records that may
   * cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly texts?: readonly MissionTextDefinition[];
  /**
   * Optional collection value on {@link MissionDialogueBundle}. Its element type defines the records that may
   * cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly portraits?: readonly MissionPortraitDefinition[];
  /**
   * collection value on {@link MissionDialogueBundle}. Its element type defines the records that may cross this
   * boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly speakers: readonly MissionSpeakerDefinition[];
  /**
   * collection value on {@link MissionDialogueBundle}. Its element type defines the records that may cross this
   * boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly lines: readonly MissionDialogueLine[];
  /**
   * collection value on {@link MissionDialogueBundle}. Its element type defines the records that may cross this
   * boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly cinematics: readonly MissionCinematicDefinition[];
}
