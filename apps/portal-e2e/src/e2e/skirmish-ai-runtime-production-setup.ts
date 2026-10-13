// prettier-ignore
import type { AiRuntimeProductionSetupV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-setup-v1";
import { createHash } from "node:crypto";

/** Canonicalizes independently read setup; duplicate physical roles and missing authored bindings fail closed. */
export function normalizeRuntimeProductionSetup(
  setup: AiRuntimeProductionSetupV1,
  bindings: Readonly<Record<string, string>>
) {
  const roles = new Map<string, string>();
  const used = new Set<string>();
  const failures: string[] = [];
  const ids = new Set(setup.actors.map((actor) => actor.actorId));
  if (
    ids.size !== setup.actors.length ||
    setup.actors.length > 256 ||
    setup.tick !== 0 ||
    Object.values(bindings).some((id) => !ids.has(id)) ||
    new Set(Object.values(bindings)).size !== Object.keys(bindings).length
  )
    failures.push("production_setup_bindings_invalid");
  for (const actor of setup.actors) {
    const authored = Object.entries(bindings).find(([, id]) => id === actor.actorId)?.[0];
    const role = authored
      ? `fixture:${authored}`
      : JSON.stringify([
          actor.definition.name,
          actor.definition.owner,
          actor.position.x,
          actor.position.y,
          actor.position.z
        ]);
    if (used.has(role) || Object.values(actor.position).some((coordinate) => !Number.isFinite(coordinate))) {
      failures.push("production_setup_role_ambiguous");
    }
    used.add(role);
    roles.set(actor.actorId, role);
  }
  const replace = (value: unknown): unknown => {
    if (typeof value === "string") return roles.get(value) ?? value;
    if (Array.isArray(value)) return value.map(replace);
    if (value && typeof value === "object")
      return Object.fromEntries(
        Object.entries(value)
          .filter(([, entry]) => entry !== undefined)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, entry]) => [key, replace(entry)])
      );
    if (typeof value === "number" && !Number.isFinite(value)) throw new Error("production_setup_number_invalid");
    return value;
  };
  const canonical = {
    seed: setup.seed,
    map: setup.map,
    content: replace(setup.content),
    topology: replace(setup.topology),
    players: replace([...setup.players].sort((a, b) => a.playerNumber - b.playerNumber)),
    commandAuthority: replace(setup.commandAuthority),
    actors: setup.actors
      .map((actor) => ({
        role: roles.get(actor.actorId) ?? "",
        position: actor.position,
        definition: replace(actor.definition)
      }))
      .sort((a, b) => a.role.localeCompare(b.role))
  };
  const encoded = JSON.stringify(canonical);
  return {
    canonical,
    roles: Object.fromEntries(roles),
    digest: failures.length ? null : createHash("sha256").update(encoded).digest("hex"),
    failures: [...new Set(failures)]
  };
}

/** Only a named physical threat/objective position may differ. Resources, weapons, levels, orders and AI state never do. */
export function compareRuntimeProductionSetups(
  left: ReturnType<typeof normalizeRuntimeProductionSetup>,
  right: ReturnType<typeof normalizeRuntimeProductionSetup>,
  changedRole?: string
) {
  if (!left.digest || !right.digest) return ["production_pair_setup_unavailable"];
  const lhs = structuredClone(left.canonical),
    rhs = structuredClone(right.canonical);
  if (changedRole) {
    const a = lhs.actors.find((actor) => actor.role === `fixture:${changedRole}`);
    const b = rhs.actors.find((actor) => actor.role === `fixture:${changedRole}`);
    if (!a || !b || JSON.stringify(a.position) === JSON.stringify(b.position))
      return ["production_pair_causal_change_missing"];
    // Retain both originals in evidence; this comparison ignores only the declared physical position.
    a.position = { x: 0, y: 0, z: 0 };
    b.position = { x: 0, y: 0, z: 0 };
    const clearTransform = (definition: unknown) => {
      if (!definition || typeof definition !== "object" || !("representable" in definition)) return definition;
      const representable = definition.representable;
      if (!representable || typeof representable !== "object" || !("logicalWorldTransform" in representable))
        return definition;
      return { ...definition, representable: { ...representable, logicalWorldTransform: { x: 0, y: 0, z: 0 } } };
    };
    a.definition = clearTransform(a.definition);
    b.definition = clearTransform(b.definition);
    // This cached local renderer flag follows the moved actor's position; vision rules and AI knowledge remain compared.
    const clearLocalVisibility = (definition: unknown) => {
      if (!definition || typeof definition !== "object" || !("vision" in definition)) return definition;
      const vision = definition.vision;
      if (!vision || typeof vision !== "object") return definition;
      const rules = Object.fromEntries(Object.entries(vision).filter(([key]) => key !== "visibilityByCurrentPlayer"));
      return { ...definition, vision: rules };
    };
    a.definition = clearLocalVisibility(a.definition);
    b.definition = clearLocalVisibility(b.definition);
  }
  return JSON.stringify(lhs) === JSON.stringify(rhs) ? [] : ["production_pair_actual_world_mismatch"];
}
