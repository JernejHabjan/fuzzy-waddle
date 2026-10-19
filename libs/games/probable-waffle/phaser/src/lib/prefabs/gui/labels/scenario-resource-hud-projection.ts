import {
  DEFAULT_SCENARIO_RESOURCE_HUD_POLICY,
  type ScenarioPresentationPolicy,
  type ScenarioResourceHudPolicy,
  ResourceType
} from "@fuzzy-waddle/probable-waffle-protocol";

/** Resource prefab discriminator used by the scenario-aware economy HUD. */
export type ScenarioResourceHudEntry = `${ResourceType}` | "housing";

/** Position of one visible counter in the editor-authored resources container. */
export interface ScenarioResourceHudEntryPosition {
  /** Counter selected by the scenario policy. */
  readonly type: ScenarioResourceHudEntry;
  /** Local horizontal coordinate in the resources container. */
  readonly x: number;
  /** Local vertical coordinate in the resources container. */
  readonly y: number;
}

/** Runtime layout projected from a resolved scenario resource policy. */
export interface ScenarioResourceHudLayout {
  /** Ordered visible counters and their local coordinates. */
  readonly entries: readonly ScenarioResourceHudEntryPosition[];
  /** Scale applied to the editor-authored inner container. */
  readonly containerScale: number;
  /** Nine-slice dimensions and scales preserving the existing five-counter default. */
  readonly background: {
    readonly width: number;
    readonly height: number;
    readonly scaleX: number;
    readonly scaleY: number;
  };
}

/**
 * Resolves absence to the legacy complete HUD and otherwise preserves authored resource
 * order. Housing is appended because it is a separate population counter rather than a
 * {@link ResourceType} owned by the economy balance.
 */
export function resolveScenarioResourceHudEntries(
  scenarioPresentation?: ScenarioPresentationPolicy
): readonly ScenarioResourceHudEntry[] {
  const policy = scenarioPresentation?.resourceHud ?? DEFAULT_SCENARIO_RESOURCE_HUD_POLICY;
  return projectPolicyEntries(policy);
}

/**
 * Reflows visible counters without changing the editor-owned prefab hierarchy. The
 * five-entry fallback deliberately reproduces the existing desktop and mobile values.
 */
export function createScenarioResourceHudLayout(
  entries: readonly ScenarioResourceHudEntry[],
  isMobile: boolean
): ScenarioResourceHudLayout {
  return {
    entries: entries.map((type, index) => ({
      type,
      x: isMobile ? 42 : 42 + index * 42,
      y: isMobile ? 21 + index * 21 : 21
    })),
    containerScale: isMobile ? 1 : 2,
    background: isMobile
      ? {
          width: 92,
          height: entries.length * 42 + 4,
          scaleX: 0.7,
          scaleY: 0.5
        }
      : {
          width: 50,
          height: 10,
          scaleX: (entries.length * 42 + 21) / 50,
          scaleY: 2.8023638778148445
        }
  };
}

function projectPolicyEntries(policy: ScenarioResourceHudPolicy): readonly ScenarioResourceHudEntry[] {
  return policy.showHousing ? [...policy.visibleResources, "housing"] : policy.visibleResources;
}
