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

export interface MissionSpeakerDefinition {
  readonly id: MissionSpeakerId;
  readonly nameTextId: MissionTextId;
  readonly portraitId?: MissionPortraitId;
}

export interface MissionPortraitDefinition {
  readonly id: MissionPortraitId;
  readonly textureKey: string;
  readonly frame?: string | number;
  readonly speakingAnimationKey?: string;
}

export interface MissionTextDefinition {
  readonly id: MissionTextId;
  readonly text: string;
}

export interface MissionDialogueLine {
  readonly id: MissionDialogueLineId;
  readonly speakerId: MissionSpeakerId;
  readonly textId: MissionTextId;
  readonly text: string;
  readonly audioAssetKey?: string;
  readonly portraitId?: MissionPortraitId;
  readonly delivery: "blocking" | "non-blocking" | "ambient" | "tutorial";
  readonly minimumTicks?: number;
}

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

interface MissionCinematicDefinitionBase {
  readonly id: MissionCinematicId;
  readonly mode: CampaignCinematicKind;
  readonly seenSkipPolicy: "hold" | "tap";
  readonly lockPlayerControl?: boolean;
  readonly lockCamera?: boolean;
  readonly resumeCueIndexes?: readonly number[];
  readonly fallbackTimeoutTicks?: number;
  readonly timeline: readonly MissionPresentationCue[];
  readonly gameplayPrelude?: readonly MissionActionDefinition[];
  /** Backward-compatible reference form for scaffold content; prefer inline gameplayPrelude. */
  readonly gameplayPreludeActionIds?: readonly MissionActionId[];
}

export type MissionCinematicDefinition = MissionCinematicDefinitionBase &
  (
    | {
        readonly gameplayFinalize: readonly MissionActionDefinition[];
        /** Backward-compatible reference form for scaffold content; prefer inline gameplayFinalize. */
        readonly gameplayFinalizeActionIds?: readonly MissionActionId[];
      }
    | {
        readonly gameplayFinalize?: undefined;
        /** Backward-compatible reference form for scaffold content; prefer inline gameplayFinalize. */
        readonly gameplayFinalizeActionIds: readonly MissionActionId[];
      }
  );

export interface MissionDialogueBundle {
  readonly schemaVersion: 1;
  readonly missionId: CampaignMissionId;
  readonly texts?: readonly MissionTextDefinition[];
  readonly portraits?: readonly MissionPortraitDefinition[];
  readonly speakers: readonly MissionSpeakerDefinition[];
  readonly lines: readonly MissionDialogueLine[];
  readonly cinematics: readonly MissionCinematicDefinition[];
}
