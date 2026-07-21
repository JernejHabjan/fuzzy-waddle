import type {
  CampaignMissionActionCancelReason,
  CampaignMissionActionContext,
  CampaignMissionActionResult,
  MissionTrustedHookId
} from "@fuzzy-waddle/probable-waffle-campaign";
import type { CampaignMissionRuntimeJsonValue } from "@fuzzy-waddle/probable-waffle-protocol";

export interface CampaignTrustedHookExecutor {
  readonly hookId: MissionTrustedHookId;
  execute(context: CampaignMissionActionContext): CampaignMissionActionResult;
  resume?(
    context: CampaignMissionActionContext,
    continuationState: CampaignMissionRuntimeJsonValue
  ): CampaignMissionActionResult;
  cancel?(
    context: CampaignMissionActionContext,
    continuationState: CampaignMissionRuntimeJsonValue,
    reason: CampaignMissionActionCancelReason
  ): void;
}

/** Explicit allow-list for rare mission code hooks; content validation owns the matching metadata registration. */
export class CampaignTrustedHookRegistry {
  private readonly executors = new Map<MissionTrustedHookId, CampaignTrustedHookExecutor>();

  register(executor: CampaignTrustedHookExecutor): void {
    if (this.executors.has(executor.hookId)) {
      throw new Error(`Campaign trusted hook '${executor.hookId}' is already registered`);
    }
    this.executors.set(executor.hookId, executor);
  }

  get(hookId: MissionTrustedHookId): CampaignTrustedHookExecutor | undefined {
    return this.executors.get(hookId);
  }

  kinds(): readonly MissionTrustedHookId[] {
    return [...this.executors.keys()].sort();
  }
}
