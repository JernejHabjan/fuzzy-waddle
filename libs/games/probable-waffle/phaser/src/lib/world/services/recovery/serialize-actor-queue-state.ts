import type { ActorDefinition } from "@fuzzy-waddle/probable-waffle-protocol";

/**
 * Hash the saved mixed lanes, not two lossy legacy views. Lane/item order, empty lanes, exact remaining work,
 * paid price/refund policy and command lineage all affect continuation. Old saves without sharedQueue retain
 * their previous representation; an explicit empty shared snapshot never falls back to stale legacy work.
 */
export function serializeActorQueueState(actor: Pick<ActorDefinition, "production" | "research" | "sharedQueue">): string {
  if (actor.sharedQueue !== undefined) {
    return `shared-v1:${encodeURIComponent(JSON.stringify(canonicalQueueValue(actor.sharedQueue)))}`;
  }
  const production = (actor.production?.queue ?? [])
    .map((item) => `${item.name ?? "?"}:${Math.round(item.remainingTime ?? 0)}`)
    .join(",");
  const research = (actor.research?.researches ?? [])
    .map((item) => `${item.type ?? "?"}:${Math.round(item.remainingTime ?? 0)}`)
    .join(",");
  return `${production};${research}`;
}

/** Canonicalize object keys only. Sorting lanes/items would erase actual scheduler differences. */
function canonicalQueueValue(value: unknown): unknown {
  if (typeof value === "number" && !Number.isFinite(value)) throw new Error("Non-finite authoritative queue state");
  if (Array.isArray(value)) return value.map(canonicalQueueValue);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
        .map(([key, child]) => [key, canonicalQueueValue(child)])
    );
  }
  return value;
}
