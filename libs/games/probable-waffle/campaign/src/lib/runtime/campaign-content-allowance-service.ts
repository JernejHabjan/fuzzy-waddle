import type { ObjectNames, ResearchType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { MissionProgressionAllowance } from "../contracts/mission-progression-allowance";

export type CampaignAllowedContentType = "actor" | "research";
export type CampaignAllowedContentId = ObjectNames | ResearchType;

export interface CampaignContentAllowanceLayer {
  readonly allowedActorIds?: readonly ObjectNames[];
  readonly deniedActorIds?: readonly ObjectNames[];
  readonly allowedResearchIds?: readonly ResearchType[];
  readonly deniedResearchIds?: readonly ResearchType[];
  readonly unitLevelCaps?: MissionProgressionAllowance["unitLevelCaps"];
}

export interface CampaignTemporaryContentGrant {
  readonly grantId: string;
  readonly playerNumber: number;
  readonly contentType: CampaignAllowedContentType;
  readonly contentId: CampaignAllowedContentId;
}

/** Resolves profile, faction/hero, mission, and temporary layers without mutating the profile. */
export class CampaignContentAllowanceService {
  private readonly layersByPlayer = new Map<number, readonly CampaignContentAllowanceLayer[]>();
  private readonly overrides = new Map<string, boolean>();
  private readonly grants = new Map<string, CampaignTemporaryContentGrant>();
  private readonly listeners = new Set<() => void>();

  configurePlayer(playerNumber: number, layers: readonly CampaignContentAllowanceLayer[]): void {
    this.layersByPlayer.set(playerNumber, layers.map(cloneLayer));
    this.notifyChanged();
  }

  setOverride(
    playerNumber: number,
    type: CampaignAllowedContentType,
    id: CampaignAllowedContentId,
    value: boolean
  ): void {
    this.overrides.set(contentKey(playerNumber, type, id), value);
    this.notifyChanged();
  }

  clearOverride(playerNumber: number, type: CampaignAllowedContentType, id: CampaignAllowedContentId): void {
    this.overrides.delete(contentKey(playerNumber, type, id));
    this.notifyChanged();
  }

  getOverride(
    playerNumber: number,
    type: CampaignAllowedContentType,
    id: CampaignAllowedContentId
  ): boolean | undefined {
    return this.overrides.get(contentKey(playerNumber, type, id));
  }

  grant(grant: CampaignTemporaryContentGrant): void {
    this.grants.set(grant.grantId, { ...grant });
    this.notifyChanged();
  }

  revoke(grantId: string): CampaignTemporaryContentGrant | undefined {
    const grant = this.grants.get(grantId);
    this.grants.delete(grantId);
    if (grant) this.notifyChanged();
    return grant;
  }

  getGrant(grantId: string): CampaignTemporaryContentGrant | undefined {
    const grant = this.grants.get(grantId);
    return grant ? { ...grant } : undefined;
  }

  resetTransientState(): void {
    this.overrides.clear();
    this.grants.clear();
    this.notifyChanged();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  isAllowed(playerNumber: number, type: CampaignAllowedContentType, id: CampaignAllowedContentId): boolean {
    const key = contentKey(playerNumber, type, id);
    const override = this.overrides.get(key);
    if (override !== undefined) return override;
    if (
      [...this.grants.values()].some(
        (grant) => contentKey(grant.playerNumber, grant.contentType, grant.contentId) === key
      )
    ) {
      return true;
    }
    return (this.layersByPlayer.get(playerNumber) ?? []).every((layer) => layerAllows(layer, type, id));
  }

  getUnitLevelCap(playerNumber: number, objectName: ObjectNames): number | undefined {
    const caps = (this.layersByPlayer.get(playerNumber) ?? [])
      .flatMap((layer) => layer.unitLevelCaps ?? [])
      .filter((cap) => cap.objectName === objectName)
      .map((cap) => cap.maximumLevel);
    return caps.length > 0 ? Math.min(...caps) : undefined;
  }

  private notifyChanged(): void {
    for (const listener of this.listeners) listener();
  }
}

function layerAllows(
  layer: CampaignContentAllowanceLayer,
  type: CampaignAllowedContentType,
  id: CampaignAllowedContentId
): boolean {
  const allowed = type === "actor" ? layer.allowedActorIds : layer.allowedResearchIds;
  const denied = type === "actor" ? layer.deniedActorIds : layer.deniedResearchIds;
  if (denied?.includes(id as never)) return false;
  return allowed === undefined || allowed.includes(id as never);
}

function contentKey(playerNumber: number, type: CampaignAllowedContentType, id: CampaignAllowedContentId): string {
  return `${playerNumber}:${type}:${id}`;
}

function cloneLayer(layer: CampaignContentAllowanceLayer): CampaignContentAllowanceLayer {
  return {
    allowedActorIds: layer.allowedActorIds ? [...layer.allowedActorIds] : undefined,
    deniedActorIds: layer.deniedActorIds ? [...layer.deniedActorIds] : undefined,
    allowedResearchIds: layer.allowedResearchIds ? [...layer.allowedResearchIds] : undefined,
    deniedResearchIds: layer.deniedResearchIds ? [...layer.deniedResearchIds] : undefined,
    unitLevelCaps: layer.unitLevelCaps?.map((cap) => ({ ...cap }))
  };
}
