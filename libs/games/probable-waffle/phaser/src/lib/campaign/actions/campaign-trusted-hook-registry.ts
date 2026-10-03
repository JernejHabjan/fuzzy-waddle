import type {
  CampaignMissionActionCancelReason,
  CampaignMissionActionContext,
  CampaignMissionActionResult,
  MissionTrustedHookId
} from "@fuzzy-waddle/probable-waffle-campaign";
import type { CampaignMissionRuntimeJsonValue } from "@fuzzy-waddle/probable-waffle-protocol";

/**
 * Defines the structured campaign trusted hook executor contract for this module. Its declared surface makes
 * hook id, execute, resume, cancel explicit to every consumer. Use this shared shape rather than an ad-hoc
 * object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignTrustedHookExecutor {
  /**
   * stable hook id used by {@link CampaignTrustedHookExecutor} to correlate this value with related records,
   * events, or authored content; it is not a display label.
   */
  readonly hookId: MissionTrustedHookId;
  /**
   * operation exposed by {@link CampaignTrustedHookExecutor}. Its signature is the compatibility boundary for
   * implementers and callers; keep ordering, return semantics, and error behavior aligned across
   * implementations.
   */
  execute(context: CampaignMissionActionContext): CampaignMissionActionResult;
  /**
   * Optional operation exposed by {@link CampaignTrustedHookExecutor}. Its signature is the compatibility
   * boundary for implementers and callers; keep ordering, return semantics, and error behavior aligned across
   * implementations.
   */
  resume?(
    context: CampaignMissionActionContext,
    continuationState: CampaignMissionRuntimeJsonValue
  ): CampaignMissionActionResult;
  /**
   * Optional operation exposed by {@link CampaignTrustedHookExecutor}. Its signature is the compatibility
   * boundary for implementers and callers; keep ordering, return semantics, and error behavior aligned across
   * implementations.
   */
  cancel?(
    context: CampaignMissionActionContext,
    continuationState: CampaignMissionRuntimeJsonValue,
    reason: CampaignMissionActionCancelReason
  ): void;
}

/** Defines the campaign trusted hook registry contract used by this module; its declared members form the compatible boundary for linked consumers. */
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
