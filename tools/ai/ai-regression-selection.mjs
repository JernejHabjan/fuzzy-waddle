const safeCaseId = /^[a-z0-9][a-z0-9-]{0,99}$/;

export function resolveAiRegressionSelection(pack, manifest, readFixture) {
  if (pack?.schemaVersion !== 1 || pack.packId !== "ai-regression-v1" || !Array.isArray(pack.selection) ||
      pack.selection.length === 0 || !Number.isSafeInteger(pack.runtimeBudgetMs) || pack.runtimeBudgetMs < 1 ||
      !pack.omissionPolicy || typeof pack.omissionPolicy !== "object" ||
      !pack.preflight || typeof pack.preflight.project !== "string" || typeof pack.preflight.testPathPattern !== "string" ||
      !Number.isSafeInteger(pack.preflight.timeoutMs) || pack.preflight.timeoutMs < 1 ||
      typeof pack.preflight.purpose !== "string") throw new Error("invalid_ai_regression_pack");
  if (manifest?.schemaVersion !== 1 || !Array.isArray(manifest.rows) || manifest.rows.length !== manifest.requiredCaseCount)
    throw new Error("invalid_ai_regression_manifest");

  const rows = new Map(manifest.rows.map((row) => [row.id, row]));
  if (rows.size !== manifest.rows.length) throw new Error("duplicate_ai_regression_manifest_rows");
  const selected = [];
  const selectedKeys = new Set();
  const selectedCaseIds = new Set();
  let estimatedWallMs = 0;
  for (const entry of pack.selection) {
    if (!entry || typeof entry.caseId !== "string" || !safeCaseId.test(entry.caseId) ||
        selectedCaseIds.has(entry.caseId) || typeof entry.scenarioId !== "string" ||
        typeof entry.variantId !== "string" || !Number.isSafeInteger(entry.repetition) || entry.repetition < 1 ||
        !Number.isSafeInteger(entry.estimatedWallMs) || entry.estimatedWallMs <= 0 ||
        !Array.isArray(entry.evidence) || entry.evidence.length === 0 ||
        entry.evidence.some((evidence) => !evidence || typeof evidence !== "object" ||
          !/^\d{13}$/.test(evidence.reportId ?? "") || evidence.status !== "diagnostic_passed" ||
          evidence.scenarioId !== entry.scenarioId || evidence.variantId !== entry.variantId ||
          !/^[a-f0-9]{40}$/.test(evidence.sourceRevision ?? "") ||
          !(evidence.dirtySourceDigest === null || /^fnv1a32:[a-f0-9]{8}$/.test(evidence.dirtySourceDigest)) ||
          !/^(?:fnv1a32:[a-f0-9]{8}|sha256:[a-f0-9]{64})$/.test(evidence.fixtureDigest ?? "")) ||
        typeof entry.covers !== "string" || entry.covers.trim().length === 0)
      throw new Error(`invalid_ai_regression_entry:${entry?.caseId ?? "unknown"}`);
    const row = rows.get(entry.scenarioId);
    if (!row || !row.drivers?.includes("runtime") || typeof row.fixture !== "string")
      throw new Error(`ai_regression_scenario_unavailable:${entry.scenarioId}`);
    const fixture = readFixture(row.fixture);
    if (fixture?.evidenceKind !== "runtime" || fixture.driver !== "runtime" ||
        !fixture.scenarioIds?.includes(row.id) || !fixture.recipe?.variants)
      throw new Error(`ai_regression_fixture_unavailable:${row.id}`);
    const variant = fixture.recipe.variants.find((candidate) => candidate.id === entry.variantId &&
      (candidate.scenarioIds === undefined || candidate.scenarioIds.includes(row.id)));
    if (!variant) throw new Error(`ai_regression_variant_missing:${row.id}:${entry.variantId}`);
    if (entry.repetition > (variant.repetitions ?? 1))
      throw new Error(`ai_regression_repetition_out_of_range:${entry.caseId}`);
    const key = `${entry.scenarioId}:${entry.variantId}:${entry.repetition}`;
    if (selectedKeys.has(key)) throw new Error(`duplicate_ai_regression_variant:${key}`);
    selectedKeys.add(key);
    selectedCaseIds.add(entry.caseId);
    estimatedWallMs += entry.estimatedWallMs;
    selected.push({ ...entry, fixtureReference: row.fixture });
  }
  if (estimatedWallMs > pack.runtimeBudgetMs)
    throw new Error(`ai_regression_estimate_exceeds_budget:${estimatedWallMs}:${pack.runtimeBudgetMs}`);

  const omissions = [];
  for (const row of manifest.rows) {
    const fixture = row.fixture ? readFixture(row.fixture) : null;
    const variants = fixture?.recipe?.variants?.filter((variant) =>
      variant.scenarioIds === undefined || variant.scenarioIds.includes(row.id)) ?? [];
    if (variants.length === 0) {
      if (!selected.some((entry) => entry.scenarioId === row.id))
        omissions.push({ scenarioId: row.id, variantId: null, reason: omissionReason(row, null, fixture, pack) });
      continue;
    }
    for (const variant of variants) {
      const isSelected = selectedKeys.has(`${row.id}:${variant.id}:1`);
      if (!isSelected) omissions.push({
        scenarioId: row.id,
        variantId: variant.id,
        reason: omissionReason(row, variant, fixture, pack)
      });
    }
  }
  return { packId: pack.packId, runtimeBudgetMs: pack.runtimeBudgetMs, estimatedWallMs, selected, omissions };
}

function omissionReason(row, variant, fixture, pack) {
  if (row.runtimeSupport?.status === "deferred_content") return pack.omissionPolicy.unsupported;
  if (row.id === "D-06") return pack.omissionPolicy.calibration;
  if (fixture?.recipe?.requiresMultiplayer === true || variant?.requiresMultiplayer === true)
    return pack.omissionPolicy.multiplayer;
  return pack.omissionPolicy.boundedSelection;
}
