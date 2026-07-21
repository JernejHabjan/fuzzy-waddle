import type { CampaignMissionActionCancelReason } from "@fuzzy-waddle/probable-waffle-campaign";

interface OwnedResourceRegistration {
  readonly ownerToken: string;
  readonly cleanup: (reason: CampaignMissionActionCancelReason) => void;
}

/** Owns non-stateful Phaser cleanup callbacks while runtime state persists the matching resource descriptors. */
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
