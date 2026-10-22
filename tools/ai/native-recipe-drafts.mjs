const nonempty = (value) => typeof value === "string" && value.trim().length > 0;
const strings = (value) => Array.isArray(value) && value.length > 0 && value.every(nonempty);
const record = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const own = (value, key) => record(value) && Object.hasOwn(value, key);

/** Authoring records are navigation only: the matrix must never treat them as executable fixtures or evidence. */
export function readNativeRecipeDraft(fixture, scenarioId) {
  if (
    fixture?.schemaVersion !== 1 ||
    fixture.evidenceKind !== "recipe_authoring" ||
    fixture.status !== "authored_not_executed" ||
    !Array.isArray(fixture.scenarioIds) ||
    !Array.isArray(fixture.cases) ||
    fixture.cases.length !== fixture.scenarioIds.length ||
    new Set(fixture.scenarioIds).size !== fixture.scenarioIds.length ||
    fixture.scenarioIds.some((id) => typeof id !== "string" || !/^[A-Z]+-[0-9]{2}$/.test(id)) ||
    new Set(fixture.cases.map((entry) => entry?.scenarioId)).size !== fixture.cases.length
  ) {
    throw new Error(`malformed_native_recipe_drafts:${scenarioId}`);
  }
  for (const entry of fixture.cases) {
    if (
      !record(entry) ||
      !fixture.scenarioIds.includes(entry.scenarioId) ||
      entry.status !== "authored_not_executed" ||
      !nonempty(entry.requirementSource) ||
      !nonempty(entry.requiredOutcome) ||
      !nonempty(entry.world) ||
      !own(fixture.worlds, entry.world) ||
      !Number.isSafeInteger(entry.maximumTick) ||
      entry.maximumTick < 1 ||
      !Array.isArray(entry.checkpointTicks) ||
      entry.checkpointTicks.length < 2 ||
      entry.checkpointTicks[0] !== 0 ||
      entry.checkpointTicks.at(-1) !== entry.maximumTick ||
      entry.checkpointTicks.some(
        (tick, index) => !Number.isSafeInteger(tick) || tick < 0 ||
          (index > 0 && tick <= entry.checkpointTicks[index - 1])
      ) ||
      !nonempty(entry.checkpointPolicy) ||
      !strings(entry.setup) ||
      !strings(entry.actions) ||
      !strings(entry.measurements) ||
      !strings(entry.required) ||
      !strings(entry.forbidden) ||
      !strings(entry.branches) ||
      !strings(entry.executionBlockers) ||
      new Set(entry.executionBlockers).size !== entry.executionBlockers.length ||
      !strings(entry.reuse)
    ) {
      throw new Error(`incomplete_native_recipe_draft:${entry?.scenarioId ?? scenarioId}`);
    }
    if (
      entry.executionBlockers.some(
        (id) => !own(fixture.hooks, id) || !nonempty(fixture.hooks[id]?.owner) || !nonempty(fixture.hooks[id]?.missing)
      )
    ) {
      throw new Error(`unknown_native_recipe_hook:${entry.scenarioId}`);
    }
  }
  const entry = fixture.cases.find((candidate) => candidate.scenarioId === scenarioId);
  if (!entry) throw new Error(`native_recipe_draft_missing:${scenarioId}`);
  return entry;
}
