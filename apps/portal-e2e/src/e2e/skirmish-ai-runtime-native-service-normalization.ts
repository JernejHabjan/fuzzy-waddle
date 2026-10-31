import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import { normalizeRuntimeMovement } from "./skirmish-ai-runtime-movement-normalization";
import { normalizeRuntimeServiceAttempts } from "./skirmish-ai-runtime-service-attempt-normalization";
import { normalizeRuntimeResourceCredits } from "./skirmish-ai-runtime-resource-credit-normalization";
import { projectRuntimeResourceServices } from "./skirmish-ai-runtime-resource-service-projection";

/** Compose native execution evidence once; cargo projection consumes the exact attempt result, never a separate order join. */
export function normalizeRuntimeNativeServices(capture: AiRuntimeProductionCaptureV1) {
  const movement = normalizeRuntimeMovement(capture), service = normalizeRuntimeServiceAttempts(capture);
  const resources = normalizeRuntimeResourceCredits(capture, service);
  const resourceServices = projectRuntimeResourceServices(capture, resources.credits);
  return { movement, service, resources, resourceServices,
    failures: [...new Set([...movement.failures, ...service.failures, ...resources.failures, ...resourceServices.failures])],
    gaps: [...new Set([...movement.gaps, ...service.gaps, ...resources.gaps, ...resourceServices.gaps])] };
}
