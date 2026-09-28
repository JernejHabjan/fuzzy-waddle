const executionKinds = new Set(["focused_preset", "focused_natural", "continuous"]);
const variantRoles = new Set(["subject", "control", "standalone"]);

function nonempty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function variantMaximumTick(recipe, variant) {
  const checkpoints = variant.checkpointTicks ?? recipe.checkpointTicks;
  return Array.isArray(checkpoints) && checkpoints.length ? Math.max(...checkpoints) : 0;
}

/** Validate declared test purpose separately from Phaser's legal-world fixture checks. */
export function validateRuntimeRecipeMetadata(recipe) {
  const pairs = new Map();
  for (const variant of recipe?.variants ?? []) {
    const kind = variant.executionKind;
    const deadline = variantMaximumTick(recipe, variant);
    if (!executionKinds.has(kind) || !variantRoles.has(variant.role))
      throw new Error(`runtime_recipe_metadata_missing:${variant.id}`);
    if (variant.role !== "standalone") {
      if (!nonempty(variant.pairId)) throw new Error(`runtime_recipe_pair_missing:${variant.id}`);
      const members = pairs.get(variant.pairId) ?? [];
      members.push(variant);
      pairs.set(variant.pairId, members);
    } else if (variant.pairId !== undefined) throw new Error(`runtime_recipe_standalone_pair:${variant.id}`);
    if (kind === "focused_preset" && !variant.presetWorld) throw new Error(`runtime_recipe_preset_missing:${variant.id}`);
    if (kind !== "focused_preset" && variant.presetWorld) throw new Error(`runtime_recipe_unexpected_preset:${variant.id}`);
    if (kind === "focused_natural" && !nonempty(variant.setupRationale))
      throw new Error(`runtime_recipe_natural_rationale_missing:${variant.id}`);
    if (kind !== "continuous" && deadline > 2000 && !nonempty(variant.deadlineRationale))
      throw new Error(`runtime_recipe_deadline_rationale_missing:${variant.id}`);
    if (variant.deadlineRationale !== undefined && !nonempty(variant.deadlineRationale))
      throw new Error(`runtime_recipe_deadline_rationale_invalid:${variant.id}`);
  }
  for (const [pairId, members] of pairs) {
    const subject = members.find((variant) => variant.role === "subject");
    const control = members.find((variant) => variant.role === "control");
    const sameRows = JSON.stringify(subject?.scenarioIds ?? null) === JSON.stringify(control?.scenarioIds ?? null);
    if (members.length !== 2 || !subject || !control ||
        subject.seed !== control.seed || !sameRows ||
        (subject.mapLabel ?? recipe.mapLabel) !== (control.mapLabel ?? recipe.mapLabel)) {
      throw new Error(`runtime_recipe_pair_mismatch:${pairId}`);
    }
  }
}

function countActors(actors) {
  const counts = new Map();
  for (const actor of actors ?? []) counts.set(actor.actorName, (counts.get(actor.actorName) ?? 0) + 1);
  return [...counts].sort(([left], [right]) => left.localeCompare(right))
    .map(([name, count]) => `${name}×${count}`).join(",") || "none";
}

function resourceSummary(entries) {
  return (entries ?? []).map((entry) => {
    const amounts = Object.entries(entry.amounts ?? {}).sort(([left], [right]) => left.localeCompare(right))
      .map(([name, amount]) => `${name}:${amount}`).join(",");
    return `P${entry.playerNumber}[${amounts}]`;
  }).join(",") || "none";
}

/** Derive navigation metadata from the actual authored variant, never requirement prose. */
export function describeRuntimeVariant(recipe, variant) {
  const preset = variant.presetWorld;
  return {
    id: variant.id,
    kind: variant.executionKind ?? "missing",
    role: variant.role ?? "missing",
    pairId: variant.pairId ?? null,
    map: variant.mapLabel ?? recipe.mapLabel,
    runs: variant.repetitions ?? 1,
    maximumTick: variantMaximumTick(recipe, variant),
    setup: preset
      ? `actors=${countActors(preset.actors)}; starts=${resourceSummary(preset.resourceStarts)}; ` +
        `grants=${resourceSummary(preset.resourceGrants)}; queues=${preset.queues?.length ?? 0}; ` +
        `orders=${preset.initialOrders?.length ?? 0}; events=${preset.events?.length ?? 0}`
      : "lobby defaults",
    rationale: [
      variant.setupRationale ? `setup: ${variant.setupRationale}` : null,
      variant.deadlineRationale ? `deadline: ${variant.deadlineRationale}` : null
    ].filter(Boolean).join("; ") || null
  };
}
