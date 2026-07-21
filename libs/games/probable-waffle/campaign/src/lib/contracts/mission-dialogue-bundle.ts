import type {
  MissionActionId,
  MissionCinematicId,
  MissionDialogueLineId,
  MissionPortraitId,
  MissionSpeakerId,
  MissionTextId
} from "./campaign-content-id";
import type { CampaignMissionId } from "@fuzzy-waddle/probable-waffle-protocol";
import type { CampaignCinematicKind } from "./campaign-content-kinds";

export interface MissionSpeakerDefinition {
  readonly id: MissionSpeakerId;
  readonly nameTextId: MissionTextId;
  readonly portraitId?: MissionPortraitId;
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
  | { readonly kind: "title"; readonly textId: MissionTextId };

export interface MissionCinematicDefinition {
  readonly id: MissionCinematicId;
  readonly mode: CampaignCinematicKind;
  readonly seenSkipPolicy: "hold" | "tap";
  readonly timeline: readonly MissionPresentationCue[];
  readonly gameplayPreludeActionIds?: readonly MissionActionId[];
  readonly gameplayFinalizeActionIds: readonly MissionActionId[];
}

export interface MissionDialogueBundle {
  readonly schemaVersion: 1;
  readonly missionId: CampaignMissionId;
  readonly speakers: readonly MissionSpeakerDefinition[];
  readonly lines: readonly MissionDialogueLine[];
  readonly cinematics: readonly MissionCinematicDefinition[];
}
