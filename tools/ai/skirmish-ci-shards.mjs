/** Derive required runtime shards from manifest rows without a second hand-maintained scenario list. */
export function planSkirmishRuntimeShards(manifest, readFixture) {
  if (manifest?.schemaVersion !== 1 || !Array.isArray(manifest.rows)) throw new Error("invalid_skirmish_manifest");
  const missing = [];
  const deferred = [];
  const groups = new Map();
  const seen = new Set();
  for (const row of manifest.rows) {
    if (typeof row?.id !== "string" || seen.has(row.id)) throw new Error(`invalid_scenario_id:${row?.id}`);
    seen.add(row.id);
    if (!row.drivers?.includes("runtime")) continue;
    if (row.runtimeSupport?.status === "deferred_content") {
      if (row.fixture !== null || row.runtimeSupport.issue !== 822 || !row.runtimeSupport.reason) {
        throw new Error(`invalid_deferred_content:${row.id}`);
      }
      deferred.push({ id: row.id, issue: row.runtimeSupport.issue, reason: row.runtimeSupport.reason });
      continue;
    }
    if (typeof row.fixture !== "string" || !/^[a-z0-9-]+\.json$/.test(row.fixture)) {
      missing.push(row.id);
      continue;
    }
    const fixture = readFixture(row.fixture);
    if (fixture?.evidenceKind !== "runtime" || fixture.driver !== "runtime" ||
      !fixture.scenarioIds?.includes(row.id) || !fixture.assertions?.[row.id] ||
      !fixture.recipe?.variants?.some((variant) =>
        variant.scenarioIds === undefined || variant.scenarioIds.includes(row.id)
      )) throw new Error(`unrunnable_runtime_fixture:${row.id}`);
    const group = `${row.group}:${row.fixture}`;
    groups.set(group, [...(groups.get(group) ?? []), row.id]);
  }
  if (seen.size !== manifest.requiredCaseCount) throw new Error("scenario_denominator_mismatch");
  if (missing.length > 0) throw new Error(`mandatory_runtime_coverage_missing:${missing.join(",")}`);
  const shards = [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, ids], index) => ({
      id: `${key.split(":")[0]}-${index + 1}`,
      scenarios: [...ids].sort().join(",")
    }));
  if (shards.length === 0) throw new Error("no_supported_runtime_shards");
  return { shards, deferred };
}
