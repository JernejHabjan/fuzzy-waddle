function applicableRows(rows, variant) {
  return rows.filter((row) => !variant.scenarioIds || variant.scenarioIds.includes(row.id));
}

function tickLimit(recipe, variant) {
  const checkpoints = variant.checkpointTicks ?? recipe.checkpointTicks ?? [];
  return checkpoints.length ? Math.max(...checkpoints) : 0;
}

/** Summarize registered runtime recipes without treating registration as executed evidence. */
export function collectRuntimeInventory(manifest, readFixture) {
  const runtimeRows = manifest.rows.filter((row) => row.drivers.includes("runtime"));
  const deferred = runtimeRows.filter((row) => row.runtimeSupport?.status === "deferred_content");
  const supported = runtimeRows.filter((row) => row.runtimeSupport?.status !== "deferred_content");
  const registered = supported.filter((row) => row.fixture);
  const fixturePaths = [...new Set(registered.map((row) => row.fixture))].sort();
  const recipes = fixturePaths.map((path) => {
    const fixture = readFixture(path);
    const rows = registered.filter((row) => row.fixture === path);
    const variants = fixture.recipe.variants.flatMap((variant) => {
      const matches = applicableRows(rows, variant);
      return matches.length ? [{ variant, matches }] : [];
    });
    const focused = variants.filter(({ variant }) => variant.executionKind?.startsWith("focused_"));
    const continuous = variants.filter(({ variant }) => variant.executionKind === "continuous");
    const flags = [];
    if (variants.some(({ variant }) => !variant.executionKind)) flags.push("execution_kind_missing");
    if (focused.length && continuous.length) flags.push("mixed_focused_continuous");
    if (focused.some(({ variant }) => !variant.presetWorld)) flags.push("focused_without_preset");
    if (focused.some(({ variant }) => tickLimit(fixture.recipe, variant) > 2000)) flags.push("focused_over_2000");
    if (variants.some(({ variant }) => (variant.repetitions ?? 1) > 1)) flags.push("repeated");
    if (variants.some(({ variant }) => !tickLimit(fixture.recipe, variant))) flags.push("missing_tick_limit");
    return {
      path,
      ids: rows.map((row) => row.id),
      variants: variants.length,
      runs: variants.reduce((sum, { variant }) => sum + (variant.repetitions ?? 1), 0),
      presetVariants: variants.filter(({ variant }) => variant.presetWorld).length,
      maximumTick: Math.max(0, ...variants.map(({ variant }) => tickLimit(fixture.recipe, variant))),
      flags
    };
  });
  return { required: runtimeRows.length, deferred: deferred.length, missing: supported.length - registered.length, recipes };
}

/** Print a bounded, one-line-per-recipe migration view for scenario authoring. */
export function renderRuntimeInventory(inventory) {
  const registered = inventory.recipes.reduce((sum, recipe) => sum + recipe.ids.length, 0);
  const lines = [
    `runtime: ${registered}/${inventory.required} registered, ${inventory.missing} supported missing, ` +
      `${inventory.deferred} deferred, ${inventory.recipes.length} recipe files`,
    "recipe | ids | variants/runs | preset variants | max tick | audit flags"
  ];
  for (const recipe of inventory.recipes) {
    lines.push(
      `${recipe.path} | ${recipe.ids.join(",")} | ${recipe.variants}/${recipe.runs} | ` +
        `${recipe.presetVariants}/${recipe.variants} | ${recipe.maximumTick} | ${recipe.flags.join(",") || "none"}`
    );
  }
  return `${lines.join("\n")}\n`;
}
