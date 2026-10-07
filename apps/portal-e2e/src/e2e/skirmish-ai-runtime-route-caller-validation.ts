import { isDeepStrictEqual } from "node:util";
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { AiRuntimeRouteCallerV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-route-caller-v1";
import { runtimeRouteOrderFenced } from "./skirmish-ai-runtime-route-order-fence";

/** Capture-wide inspection includes orphan, failed, nested and overflow tails before any caller receives credit. */
export function validateRuntimeRouteCallers(capture: AiRuntimeProductionCaptureV1) {
  const identities = new Map<number, { actorId: string | null; canonical: string;
    caller: AiRuntimeRouteCallerV1; sequence: number; fenced: boolean }>();
  const requests = new Map<number, AiRuntimeRouteCallerV1 | undefined>();
  const failures: string[] = [];
  for (const fact of capture.facts) {
    if (fact.kind !== "spatial_authority" || fact.spatial.kind !== "producer_path") continue;
    const path = fact.spatial, caller = path.queryCaller;
    if (path.phase === "requested") requests.set(path.queryId, caller);
    if (caller === undefined) continue;
    if (!caller || !Number.isSafeInteger(caller.invocationId) || caller.invocationId < 1 || caller.invocationId > 8192 ||
      typeof caller.lifetimeValid !== "boolean" || caller.order === undefined ||
      !["initial", "repath", "fallback"].includes(caller.stage) ||
      !["range_probe", "reachability_probe", "actor_movement", "location_movement", "tending_movement",
        "boarding_adjacent", "boarding_ground_shore", "boarding_container_shore"].includes(caller.caller)) {
      failures.push("production_route_query_caller_payload_invalid"); continue;
    }
    const probe = ["range_probe", "reachability_probe"].includes(caller.caller);
    const objectInitial = probe || ["actor_movement", "boarding_adjacent"].includes(caller.caller);
    if ((caller.order === null) !== (caller.caller === "boarding_container_shore") ||
      probe && caller.stage !== "initial" ||
      path.method !== (caller.stage === "initial" ? objectInitial ? "object_radius" : "tile_static" : "tile_dynamic")) {
      failures.push("production_route_query_caller_method_invalid");
    }
    if (path.phase !== "requested") {
      const requested = requests.get(path.queryId);
      if (!requested || !isDeepStrictEqual({ ...requested, lifetimeValid: false }, { ...caller, lifetimeValid: false })) {
        failures.push("production_route_query_caller_interval_invalid");
      }
    }
    const previous = identities.get(caller.invocationId);
    const admission = caller.order && capture.facts.find((entry) => entry.kind === "spatial_authority" &&
      entry.spatial.kind === "route_order" && entry.spatial.order.orderId === caller.order?.orderId &&
      entry.sequence < fact.sequence);
    if (caller.lifetimeValid && admission &&
      runtimeRouteOrderFenced(capture, path.source.actorId, admission.sequence, fact.sequence)) {
      failures.push("production_route_query_caller_lifetime_revived");
    }
    const fenced = !!previous && (previous.fenced || !previous.caller.lifetimeValid ||
      runtimeRouteOrderFenced(capture, path.source.actorId, previous.sequence, fact.sequence));
    if (previous && (previous.actorId !== path.source.actorId || previous.canonical !== path.source.canonicalObjectName ||
      previous.caller.caller !== caller.caller || !isDeepStrictEqual(previous.caller.order, caller.order))) {
      failures.push("production_route_query_caller_identity_conflict");
    }
    if (fenced && caller.lifetimeValid) failures.push("production_route_query_caller_lifetime_revived");
    identities.set(caller.invocationId, { actorId: path.source.actorId, canonical: path.source.canonicalObjectName,
      caller, sequence: fact.sequence, fenced });
  }
  return { overflow: identities.size > 256, failures: [...new Set(failures)] };
}
