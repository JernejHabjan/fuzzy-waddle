import type { ObjectNames, ResearchType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { MissionProgressionAllowance } from "../contracts/mission-progression-allowance";

/**
 * Defines the closed campaign allowed content type value set. Keeping this union named preserves exhaustive
 * handling and prevents incompatible free-form values at its boundaries.
 */
export type CampaignAllowedContentType = "actor" | "research";
/**
 * Defines the closed campaign allowed content id value set. Keeping this union named preserves exhaustive
 * handling and prevents incompatible free-form values at its boundaries.
 */
export type CampaignAllowedContentId = ObjectNames | ResearchType;

/**
 * Defines the structured campaign content allowance layer contract for this module. Its declared surface makes
 * allowed actor ids, denied actor ids, allowed research ids, denied research ids, unit level caps explicit to
 * every consumer. Use this shared shape rather than an ad-hoc object so adapters, persistence, and callers
 * remain compatible.
 */
export interface CampaignContentAllowanceLayer {
  /**
   * Optional boolean policy/value on {@link CampaignContentAllowanceLayer} that explicitly controls whether the
   * associated behavior is active; do not infer it from unrelated state.
   */
  readonly allowedActorIds?: readonly ObjectNames[];
  /**
   * Optional collection owned by {@link CampaignContentAllowanceLayer}. Preserve the declared element contract
   * and any ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly deniedActorIds?: readonly ObjectNames[];
  /**
   * Optional boolean policy/value on {@link CampaignContentAllowanceLayer} that explicitly controls whether the
   * associated behavior is active; do not infer it from unrelated state.
   */
  readonly allowedResearchIds?: readonly ResearchType[];
  /**
   * Optional collection owned by {@link CampaignContentAllowanceLayer}. Preserve the declared element contract
   * and any ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly deniedResearchIds?: readonly ResearchType[];
  /**
   * Optional unit level caps value carried by {@link CampaignContentAllowanceLayer}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  readonly unitLevelCaps?: MissionProgressionAllowance["unitLevelCaps"];
}

/**
 * Defines the structured campaign temporary content grant contract for this module. Its declared surface makes
 * grant id, player number, content type, content id explicit to every consumer. Use this shared shape rather
 * than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignTemporaryContentGrant {
  /**
   * stable grant id used by {@link CampaignTemporaryContentGrant} to correlate this value with related records,
   * events, or authored content; it is not a display label.
   */
  readonly grantId: string;
  /**
   * numeric player number carried by {@link CampaignTemporaryContentGrant}. Its units and valid range are
   * defined by {@link CampaignTemporaryContentGrant} and must remain consistent across producers and consumers.
   */
  readonly playerNumber: number;
  /**
   * discriminator for {@link CampaignTemporaryContentGrant}. It selects the valid branch and behavior, so
   * producers and consumers must keep it synchronized with the accompanying fields.
   */
  readonly contentType: CampaignAllowedContentType;
  /**
   * stable content id used by {@link CampaignTemporaryContentGrant} to correlate this value with related
   * records, events, or authored content; it is not a display label.
   */
  readonly contentId: CampaignAllowedContentId;
}

/** Defines the campaign content allowance service contract used by this module; its declared members form the compatible boundary for linked consumers. */
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
