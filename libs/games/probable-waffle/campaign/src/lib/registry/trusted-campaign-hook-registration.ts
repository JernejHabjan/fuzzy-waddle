import type { MissionTrustedHookId } from "../contracts/campaign-content-id";

export interface TrustedCampaignHookRegistration {
  readonly kind: MissionTrustedHookId;
  readonly description: string;
  readonly determinismNotes: string;
  readonly serializationNotes: string;
  readonly cleanupNotes: string;
  readonly testId: string;
}
