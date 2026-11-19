import { selectedRuntimeCheckpoints } from "../validation/skirmish-runtime-recipe-metadata.ts";
import { nativeScenarioBindings } from "../registration/native-scenario-registration.ts";

function applicableRows(rows, variant) {
  return rows.filter((row) => !variant.scenarioIds || variant.scenarioIds.includes(row.id));
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
      if (!matches.length) return [];
      const checkpoints = selectedRuntimeCheckpoints(fixture, variant, matches.map((row) => row.id));
      const nativeProbe = matches.length === 1 && nativeScenarioBindings.cases[matches[0].id]?.evidenceCheckpoints;
      return [{ variant, checkpoints, maximumTick: Math.max(0, ...checkpoints), nativeProbe: !!nativeProbe }];
    });
    const focused = variants.filter(({ variant }) => variant.executionKind?.startsWith("focused_"));
    const continuous = variants.filter(({ variant }) => variant.executionKind === "continuous");
    const flags = [];
    if (variants.some(({ variant }) => !variant.executionKind)) flags.push("execution_kind_missing");
    if (focused.length && continuous.length) flags.push("mixed_focused_continuous");
    if (focused.some(({ variant }) => !variant.presetWorld)) flags.push("focused_without_preset");
    if (focused.some(({ maximumTick }) => maximumTick > 2000)) flags.push("focused_over_2000");
    if (variants.some(({ variant }) => (variant.repetitions ?? 1) > 1)) flags.push("repeated");
    if (variants.some(({ maximumTick }) => !maximumTick)) flags.push("missing_tick_limit");
    return {
      path,
      ids: rows.map((row) => row.id),
      variants: variants.length,
      runs: variants.reduce((sum, { variant }) => sum + (variant.repetitions ?? 1), 0),
      presetVariants: variants.filter(({ variant }) => variant.presetWorld).length,
      maximumTick: Math.max(0, ...variants.map(({ maximumTick }) => maximumTick)),
      scheduledTicks: variants.reduce((sum, { variant, maximumTick }) => sum + maximumTick * (variant.repetitions ?? 1), 0),
      scheduledCheckpoints: variants.reduce(
        (sum, { variant, checkpoints }) => sum + checkpoints.length * (variant.repetitions ?? 1),
        0
      ),
      combatCaptureVariants: variants.filter(({ variant }) => variant.captureCombat === true).length,
      evidenceStopVariants: variants.filter(({ variant, nativeProbe }) => nativeProbe || variant.evidenceStop !== undefined).length,
      flags
    };
  });
  return {
    required: runtimeRows.length,
    deferred: deferred.length,
    missing: supported.length - registered.length,
    authoredDrafts: supported.filter((row) => !row.fixture && row.runtimeRecipeDraft).length,
    recipes
  };
}

/** Print a bounded, one-line-per-recipe migration view for scenario authoring. */
export function renderRuntimeInventory(inventory) {
  const registered = inventory.recipes.reduce((sum, recipe) => sum + recipe.ids.length, 0);
  const lines = [
    `runtime: ${registered}/${inventory.required} registered, ${inventory.missing} supported missing, ` +
      `${inventory.deferred} deferred, ${inventory.recipes.length} recipe files`,
    `native specifications: ${inventory.authoredDrafts ?? 0} authored, not executable or executed; excluded from registered counts`,
    "recipe | ids | variants/runs | preset variants | max tick | scheduled ticks/checkpoints | combat/early stop | audit flags"
  ];
  for (const recipe of inventory.recipes) {
    lines.push(
      `${recipe.path} | ${recipe.ids.join(",")} | ${recipe.variants}/${recipe.runs} | ` +
        `${recipe.presetVariants}/${recipe.variants} | ${recipe.maximumTick} | ` +
        `${recipe.scheduledTicks}/${recipe.scheduledCheckpoints} | ${recipe.combatCaptureVariants}/${recipe.evidenceStopVariants} | ` +
        `${recipe.flags.join(",") || "none"}`
    );
  }
  return `${lines.join("\n")}\n`;
}
