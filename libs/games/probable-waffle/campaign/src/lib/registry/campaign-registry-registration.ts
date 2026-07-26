/**
 * Defines the structured campaign registry registration contract for this module. Its declared surface makes
 * kind, description explicit to every consumer. Use this shared shape rather than an ad-hoc object so
 * adapters, persistence, and callers remain compatible.
 */
export interface CampaignRegistryRegistration<TKind extends string> {
  /**
   * discriminator for {@link CampaignRegistryRegistration}. It selects the valid branch and behavior, so
   * producers and consumers must keep it synchronized with the accompanying fields.
   */
  readonly kind: TKind;
  /**
   * human-facing description for {@link CampaignRegistryRegistration}. It supports UI, narration, or diagnostics
   * and must not be used as the stable identity of the record.
   */
  readonly description: string;
}
