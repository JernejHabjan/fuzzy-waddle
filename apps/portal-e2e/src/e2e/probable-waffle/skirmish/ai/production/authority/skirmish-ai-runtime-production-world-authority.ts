// prettier-ignore
import type { AiRuntimeProductionSnapshot } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/test-support/production/lifecycle/ai-runtime-production-snapshot";
// prettier-ignore
import type { AiRuntimePresetApplication } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/test-support/presets/setup/ai-runtime-preset-application";
import { normalizeRuntimeProductionWorld } from "../world/skirmish-ai-runtime-production-world-normalization";
import { normalizeRuntimeProductionInitialQueues } from "../queues/skirmish-ai-runtime-production-initial-queue-normalization";
import { normalizeRuntimeProductionDecisions } from "../decisions/skirmish-ai-runtime-production-decisions";
import { normalizeRuntimeProductionSpatial } from "../world/skirmish-ai-runtime-production-spatial-normalization";
import { normalizeRuntimeNativeServices } from "../../economy/service/skirmish-ai-runtime-native-service-normalization";
import { normalizeRuntimeConstructionAuthority } from "../../construction/capture/skirmish-ai-runtime-construction-authority";
import { projectRuntimeConstructionLineage } from "../../construction/capture/skirmish-ai-runtime-construction-lineage-projection";
import { projectRuntimeConstructionCatalog } from "../../construction/capture/skirmish-ai-runtime-construction-catalog-projection";

/** Groups existing world/setup/definition authority readers; it does not clear any of their omissions. */
export function normalizeRuntimeProductionWorldAuthority(
  capture: AiRuntimeProductionSnapshot,
  setup: AiRuntimePresetApplication | undefined
) {
  const failures: string[] = [];
  const gaps = new Set<string>();
  const world = normalizeRuntimeProductionWorld(capture);
  failures.push(...world.failures);
  world.gaps.forEach((gap) => gaps.add(gap));
  const initial = normalizeRuntimeProductionInitialQueues(capture, setup);
  failures.push(...initial.failures);
  initial.gaps.forEach((gap) => gaps.add(gap));
  const cadence = normalizeRuntimeProductionDecisions(capture);
  failures.push(...cadence.failures);
  cadence.gaps.forEach((gap) => gaps.add(gap));
  const spatial = normalizeRuntimeProductionSpatial(capture);
  failures.push(...spatial.failures);
  spatial.gaps.forEach((gap) => gaps.add(gap));
  const native = normalizeRuntimeNativeServices(capture);
  failures.push(...native.failures);
  native.gaps.forEach((gap) => gaps.add(gap));
  const construction = normalizeRuntimeConstructionAuthority(capture);
  failures.push(...construction.failures);
  construction.gaps.forEach((gap) => gaps.add(gap));
  const constructionLineage = projectRuntimeConstructionLineage(capture, spatial.authority, construction.records);
  failures.push(...constructionLineage.failures);
  constructionLineage.gaps.forEach((gap) => gaps.add(gap));
  const constructionCatalog = projectRuntimeConstructionCatalog(spatial.authority, constructionLineage.entries);
  failures.push(...constructionCatalog.failures);
  constructionCatalog.gaps.forEach((gap) => gaps.add(gap));
  return {
    world,
    initial,
    cadence,
    spatial,
    native,
    construction,
    constructionLineage,
    constructionCatalog,
    failures,
    gaps: [...gaps]
  };
}
