export interface CampaignRegistryRegistration<TKind extends string> {
  readonly kind: TKind;
  readonly description: string;
}
