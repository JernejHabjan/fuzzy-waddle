/** Defines the campaign kind registry contract used by this module; its declared members form the compatible boundary for linked consumers. */
export class CampaignKindRegistry<TKind extends string, TRegistration extends { readonly kind: TKind }> {
  private readonly registrations = new Map<TKind, TRegistration>();

  register(registration: TRegistration): void {
    if (this.registrations.has(registration.kind)) {
      throw new Error(`Campaign registry kind '${registration.kind}' is already registered`);
    }
    this.registrations.set(registration.kind, registration);
  }

  has(kind: TKind | string): boolean {
    return this.registrations.has(kind as TKind);
  }

  getRequired(kind: TKind): TRegistration {
    const registration = this.registrations.get(kind);
    if (!registration) throw new Error(`Campaign registry kind '${kind}' is not registered`);
    return registration;
  }

  kinds(): readonly TKind[] {
    return [...this.registrations.keys()].sort((left, right) => left.localeCompare(right));
  }
}
