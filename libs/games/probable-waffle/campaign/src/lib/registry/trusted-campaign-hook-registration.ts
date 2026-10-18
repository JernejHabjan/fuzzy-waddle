import type { MissionTrustedHookId } from "../contracts/campaign-content-id";

/**
 * Defines the structured trusted campaign hook registration contract for this module. Its declared surface
 * makes kind, description, determinism notes, serialization notes, cleanup notes explicit to every consumer.
 * Use this shared shape rather than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface TrustedCampaignHookRegistration {
  /**
   * discriminator for {@link TrustedCampaignHookRegistration}. It selects the valid branch and behavior, so
   * producers and consumers must keep it synchronized with the accompanying fields.
   */
  readonly kind: MissionTrustedHookId;
  /**
   * human-facing description for {@link TrustedCampaignHookRegistration}. It supports UI, narration, or
   * diagnostics and must not be used as the stable identity of the record.
   */
  readonly description: string;
  /**
   * string determinism notes carried by {@link TrustedCampaignHookRegistration}. Treat it according to the
   * owning contract’s validation and presentation rules rather than assuming it is a stable identifier.
   */
  readonly determinismNotes: string;
  /**
   * string serialization notes carried by {@link TrustedCampaignHookRegistration}. Treat it according to the
   * owning contract’s validation and presentation rules rather than assuming it is a stable identifier.
   */
  readonly serializationNotes: string;
  /**
   * string cleanup notes carried by {@link TrustedCampaignHookRegistration}. Treat it according to the owning
   * contract’s validation and presentation rules rather than assuming it is a stable identifier.
   */
  readonly cleanupNotes: string;
  /**
   * stable test id used by {@link TrustedCampaignHookRegistration} to correlate this value with related records,
   * events, or authored content; it is not a display label.
   */
  readonly testId: string;
}
