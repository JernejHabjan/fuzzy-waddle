// prettier-ignore
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
// prettier-ignore
import type { AiRuntimePresetApplicationV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-preset-application-v1";
import { normalizeRuntimeProductionWorld } from "./skirmish-ai-runtime-production-world-normalization";
import { normalizeRuntimeProductionInitialQueues } from "./skirmish-ai-runtime-production-initial-queue-normalization";
import { normalizeRuntimeProductionDecisions } from "./skirmish-ai-runtime-production-decisions";
import { normalizeRuntimeProductionSpatial } from "./skirmish-ai-runtime-production-spatial-normalization";
import { normalizeRuntimeNativeServices } from "./skirmish-ai-runtime-native-service-normalization";
import { normalizeRuntimeConstructionAuthority } from "./skirmish-ai-runtime-construction-authority";
import { projectRuntimeConstructionLineage } from "./skirmish-ai-runtime-construction-lineage-projection";
import { projectRuntimeConstructionCatalog } from "./skirmish-ai-runtime-construction-catalog-projection";

/** Groups existing world/setup/definition authority readers; it does not clear any of their omissions. */
export function normalizeRuntimeProductionWorldAuthority(
  capture: AiRuntimeProductionCaptureV1,
  setup: AiRuntimePresetApplicationV1 | undefined
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
