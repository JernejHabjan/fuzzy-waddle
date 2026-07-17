// Helper to get the canonical actor name, resolving randomOfType variants to their parent
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import { pwActorDefinitions } from "../../prefabs/definitions/actor-definitions";
import type { PrefabDefinition } from "../../prefabs/definitions/prefab-definition";

/**
 * Cache for canonical name lookups to avoid repeated iteration.
 * Built on first successful access.
 */
let canonicalNameCache: Map<ObjectNames, ObjectNames> | null = null;

/**
 * Try to build the cache once.
 * Only builds if pwActorDefinitions is ready (non-empty).
 */
function tryBuildCanonicalNameCacheOnce() {
  if (canonicalNameCache) return; // already built
  if (!pwActorDefinitions || Object.keys(pwActorDefinitions).length === 0) return; // not ready

  const map = new Map<ObjectNames, ObjectNames>();

  for (const [parentName, definition] of Object.entries(pwActorDefinitions) as [ObjectNames, PrefabDefinition][]) {
    const randomTypes = definition.meta?.randomOfType;
    if (Array.isArray(randomTypes)) {
      for (const variant of randomTypes) {
        map.set(variant as ObjectNames, parentName);
      }
    }
  }

  canonicalNameCache = map;
}

/**
 * Very fast lookup.
 * Semi-lazy: first call that sees definitions ready will build the cache.
 */
export function getCanonicalActorNameCached(actorName: ObjectNames | string): ObjectNames {
  // Attempt to build if not built yet
  tryBuildCanonicalNameCacheOnce();

  const name = actorName as ObjectNames;

  // Use cache if built, else fallback to name
  return canonicalNameCache?.get(name) ?? name;
}
