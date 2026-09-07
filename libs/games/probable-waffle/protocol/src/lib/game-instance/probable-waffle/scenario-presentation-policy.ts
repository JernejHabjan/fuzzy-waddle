import { ResourceType } from "../../probable-waffle/resource-type-definition";

/**
 * Controls which economy counters a scenario exposes without changing the underlying
 * player economy. Resource order is presentation order and survives save/reconnect
 * serialization through {@link ScenarioPresentationPolicy}.
 */
export interface ScenarioResourceHudPolicy {
  /** Ordered resource counters shown by the HUD. An empty collection hides every resource counter. */
  readonly visibleResources: readonly ResourceType[];
  /** Whether the current/max population counter is shown after the resource counters. */
  readonly showHousing: boolean;
}

/**
 * Scenario-owned presentation configuration copied into game-mode data at launch.
 * It is deliberately independent of campaign contracts so tutorials, challenges,
 * custom scenarios, and future game modes can reuse the same runtime authority.
 */
export interface ScenarioPresentationPolicy {
  /** Resource and housing visibility for the local player's economy HUD. */
  readonly resourceHud: ScenarioResourceHudPolicy;
}

/** Existing game modes use the complete economy HUD when no scenario policy is authored. */
export const DEFAULT_SCENARIO_RESOURCE_HUD_POLICY: ScenarioResourceHudPolicy = {
  visibleResources: [ResourceType.Food, ResourceType.Wood, ResourceType.Stone, ResourceType.Minerals],
  showHousing: true
};

/**
 * Narrows untrusted serialized data before it enters mission or game-mode contracts.
 * Exact keys, valid resource values, and unique resource entries keep authored order
 * deterministic and distinguish an intentionally empty list from a missing policy.
 */
export function isScenarioPresentationPolicy(value: unknown): value is ScenarioPresentationPolicy {
  if (!isObjectWithExactKeys(value, ["resourceHud"])) return false;
  const resourceHud = value.resourceHud;
  if (!isObjectWithExactKeys(resourceHud, ["visibleResources", "showHousing"])) return false;
  if (!Array.isArray(resourceHud.visibleResources) || typeof resourceHud.showHousing !== "boolean") return false;

  const supportedResources = new Set<string>(Object.values(ResourceType));
  const resources = resourceHud.visibleResources;
  return (
    resources.every(
      (resource): resource is ResourceType => typeof resource === "string" && supportedResources.has(resource)
    ) && new Set(resources).size === resources.length
  );
}

function isObjectWithExactKeys<TKeys extends string>(
  value: unknown,
  expectedKeys: readonly TKeys[]
): value is { readonly [TKey in TKeys]: unknown } {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  return keys.length === expectedKeys.length && keys.every((key) => expectedKeys.includes(key as TKeys));
}
