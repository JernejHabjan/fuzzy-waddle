import type { CampaignMissionId, FactionType, ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import type { CampaignRewardKind } from "./campaign-content-kinds";
import type { CampaignUnlockId, MissionRewardId, MissionTextId } from "./campaign-content-id";

export type MissionRewardScope =
  | { readonly kind: "global" }
  | { readonly kind: "faction"; readonly faction: FactionType }
  | { readonly kind: "actor"; readonly objectName: ObjectNames };

export interface MissionRewardDefinition {
  readonly id: MissionRewardId;
  readonly kind: CampaignRewardKind;
  readonly titleTextId: MissionTextId;
  readonly scope: MissionRewardScope;
  readonly oneTime: boolean;
  readonly amount?: number;
  readonly unlockId?: CampaignUnlockId;
}

export interface MissionRewardBundle {
  readonly schemaVersion: 1;
  readonly missionId: CampaignMissionId;
  readonly rewards: readonly MissionRewardDefinition[];
}
