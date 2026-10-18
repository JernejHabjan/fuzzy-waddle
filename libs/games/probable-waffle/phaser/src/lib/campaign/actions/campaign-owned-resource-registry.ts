import type { CampaignMissionActionCancelReason } from "@fuzzy-waddle/probable-waffle-campaign";

/**
 * Defines the structured owned resource registration contract for this module. Its declared surface makes
 * owner token, cleanup explicit to every consumer. Use this shared shape rather than an ad-hoc object so
 * adapters, persistence, and callers remain compatible.
 */
interface OwnedResourceRegistration {
  /**
   * string owner token carried by {@link OwnedResourceRegistration}. Treat it according to the owning contract’s
   * validation and presentation rules rather than assuming it is a stable identifier.
   */
  readonly ownerToken: string;
  /**
   * cleanup value carried by {@link OwnedResourceRegistration}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly cleanup: (reason: CampaignMissionActionCancelReason) => void;
}

/** Defines the campaign owned resource registry contract used by this module; its declared members form the compatible boundary for linked consumers. */
export class CampaignOwnedResourceRegistry {
  private readonly resources = new Map<string, OwnedResourceRegistration>();

  register(ownerToken: string, resourceId: string, cleanup: (reason: CampaignMissionActionCancelReason) => void): void {
    const existing = this.resources.get(resourceId);
    if (existing && existing.ownerToken !== ownerToken) {
      throw new Error(`Campaign resource '${resourceId}' is already owned by '${existing.ownerToken}'`);
    }
    this.resources.set(resourceId, { ownerToken, cleanup });
  }

  release(ownerToken: string, resourceIds: readonly string[], reason: CampaignMissionActionCancelReason): string[] {
    const leaked: string[] = [];
    for (const resourceId of [...resourceIds].sort()) {
      const registration = this.resources.get(resourceId);
      if (!registration || registration.ownerToken !== ownerToken) {
        leaked.push(resourceId);
        continue;
      }
      try {
        registration.cleanup(reason);
      } catch {
        leaked.push(resourceId);
      } finally {
        this.resources.delete(resourceId);
      }
    }
    return leaked;
  }

  has(resourceId: string): boolean {
    return this.resources.has(resourceId);
  }

  destroy(): void {
    for (const [resourceId, registration] of [...this.resources].sort(([left], [right]) => left.localeCompare(right))) {
      try {
        registration.cleanup("scene-shutdown");
      } finally {
        this.resources.delete(resourceId);
      }
    }
  }
}
