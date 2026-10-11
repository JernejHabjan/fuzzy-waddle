import { isRecord } from "./skirmish-matrix-io.mjs";

function requiredText(value, label) {
  if (typeof value !== "string" || value.length === 0) throw new Error(`repair_report_missing_${label}`);
  return value;
}

function brief(value, limit = 160) {
  const text = String(value ?? "unknown").replace(/\s+/g, " ");
  return text.length > limit ? `${text.slice(0, limit)}…` : text;
}

function classify(code, report) {
  if (!report.runtime || (report.workCounts?.decisions ?? 0) <= 0 || (report.workCounts?.ticks ?? 0) <= 0)
    return "infrastructure";
  if (/^(runtime_preset_|invalid_preset|fixture_|map_|setup_)/.test(code)) return "setup";
  if (/^(browser_|playwright_|process_|runtime_payload_|runtime_zero_work|missing_required_row)/.test(code))
    return "infrastructure";
  return "behavior";
}

function observedCheckpoint(variant) {
  const last = variant?.checkpoints?.at(-1);
  if (!isRecord(last)) return { tick: null, result: null };
  return {
    tick: Number.isSafeInteger(last.tick) ? last.tick : null,
    result: typeof last.gameResult === "string" ? brief(last.gameResult, 80) : null,
    workers: Number.isSafeInteger(last.workerCount) ? last.workerCount : null,
    army: Array.isArray(last.militaryActorNames) ? last.militaryActorNames.length : null
  };
}

function failureRecord(report, path, source, scenario, failure) {
  const separator = failure.indexOf(":");
  const variantId = separator >= 0 ? failure.slice(0, separator) : "unknown";
  const code = separator >= 0 ? failure.slice(separator + 1) : failure;
  const variant = scenario.variants?.find((candidate) => candidate.variantId === variantId);
  const classification = classify(code, report);
  const map = variant?.mapLabel ?? source.map;
  return {
    key: [classification, source.group, map, code].join("|"),
    classification,
    group: source.group,
    map,
    code: brief(code),
    scenarioId: scenario.scenarioId,
    variantId: brief(variantId, 80),
    repetition: Number.isSafeInteger(variant?.repetition) ? variant.repetition : null,
    seed: Number.isSafeInteger(variant?.seed) ? variant.seed : report.seed,
    observed: observedCheckpoint(variant),
    stopReason: variant?.stopReason ?? null,
    path
  };
}

function validateReport(report, path, shared, fixtures, rows) {
  if (!isRecord(report) || report.schemaVersion !== 1) throw new Error(`repair_report_invalid_schema:${path}`);
  if (report.diagnosticSelection || report.runtime?.diagnosticSelection ||
      !["passed", "failed"].includes(report.status)) throw new Error(`repair_report_not_full_coverage:${path}`);
  for (const field of ["runId", "candidate", "manifestVersion"]) requiredText(report[field], field);
  requiredText(report.fixtureDigest, "fixture_digest");
  if (!Array.isArray(report.rows) || report.rows.length === 0 || !Array.isArray(report.scenarioSources) ||
      !Array.isArray(report.fixtureIdentityDigests)) throw new Error(`repair_report_missing_membership:${path}`);
  if (shared) {
    for (const field of ["runId", "candidate", "dirtySourceDigest", "manifestVersion"]) {
      if (report[field] !== shared[field]) throw new Error(`repair_report_provenance_mismatch:${field}:${path}`);
    }
  }
  const sources = new Map();
  for (const source of report.scenarioSources) {
    if (!isRecord(source) || typeof source.scenarioId !== "string" || typeof source.reference !== "string" ||
        typeof source.group !== "string" || typeof source.map !== "string" || sources.has(source.scenarioId)) {
      throw new Error(`repair_report_invalid_source:${path}`);
    }
    sources.set(source.scenarioId, source);
  }
  const localFixtures = new Map();
  for (const fixture of report.fixtureIdentityDigests) {
    if (!isRecord(fixture) || typeof fixture.reference !== "string" || typeof fixture.digest !== "string" ||
        localFixtures.has(fixture.reference)) throw new Error(`repair_report_invalid_fixture:${path}`);
    if (fixtures.has(fixture.reference) && fixtures.get(fixture.reference) !== fixture.digest)
      throw new Error(`repair_report_fixture_conflict:${fixture.reference}`);
    localFixtures.set(fixture.reference, fixture.digest);
    fixtures.set(fixture.reference, fixture.digest);
  }
  const localRows = new Set(report.rows);
  for (const id of report.rows) {
    if (typeof id !== "string" || rows.has(id) || !sources.has(id) || !localFixtures.has(sources.get(id).reference))
      throw new Error(`repair_report_row_conflict:${id}:${path}`);
    rows.add(id);
  }
  const referencedFixtures = new Set([...sources.values()].map((source) => source.reference));
  if (sources.size !== report.rows.length || localFixtures.size === 0 ||
      [...localFixtures.keys()].some((reference) => !referencedFixtures.has(reference)))
    throw new Error(`repair_report_unexpected_membership:${path}`);
  if (report.runtime && (!Array.isArray(report.runtime.scenarios) ||
      report.runtime.scenarios.some((scenario) => !localRows.has(scenario.scenarioId)) ||
      new Set(report.runtime.scenarios.map((scenario) => scenario.scenarioId)).size !== report.runtime.scenarios.length)) {
    throw new Error(`repair_report_invalid_runtime:${path}`);
  }
  return sources;
}

/** Turn retained runtime shards into a bounded, provenance-checked agent handoff. */
export function buildRepairReport(entries, options = {}) {
  if (!Array.isArray(entries) || entries.length === 0) throw new Error("repair_report_no_artifacts");
  const maxClusters = options.maxClusters ?? 16;
  const maxBytes = options.maxBytes ?? 16384;
  if (!Number.isSafeInteger(maxClusters) || maxClusters < 1 || !Number.isSafeInteger(maxBytes) || maxBytes < 1024)
    throw new Error("repair_report_invalid_limit");
  const fixtures = new Map();
  const rows = new Set();
  const failures = [];
  let passed = 0;
  let unexecuted = 0;
  let shared = null;
  for (const { path, report } of entries) {
    const sources = validateReport(report, path, shared, fixtures, rows);
    shared ??= report;
    const scenarios = new Map((report.runtime?.scenarios ?? []).map((scenario) => [scenario.scenarioId, scenario]));
    const hasWork = (report.workCounts?.decisions ?? 0) > 0 && (report.workCounts?.ticks ?? 0) > 0;
    for (const id of report.rows) {
      const scenario = scenarios.get(id);
      if (!scenario || !hasWork) {
        unexecuted += 1;
        const code = !scenario ? "runtime_payload_missing" : "runtime_zero_work";
        failures.push(failureRecord(report, path, sources.get(id), { scenarioId: id }, `unknown:${code}`));
      } else if (scenario.passed && (!scenario.failures || scenario.failures.length === 0)) {
        passed += 1;
      } else {
        const codes = scenario.failures?.length ? scenario.failures : ["unknown:scenario_failed_without_reason"];
        for (const code of codes) failures.push(failureRecord(report, path, sources.get(id), scenario, code));
      }
    }
    const processFailed = report.process?.exitCode !== undefined && report.process.exitCode !== 0;
    if (hasWork && (report.status !== "passed" || processFailed) && report.rows.every((id) => scenarios.get(id)?.passed)) {
      const id = report.rows[0];
      if (id) {
        passed -= 1;
        failures.push(failureRecord(report, path, sources.get(id), { scenarioId: id },
          `unknown:process_failed:${brief(report.reason ?? report.process?.exitCode)}`));
      }
    }
  }
  const expectedIds = options.expectedIds ?? [...rows];
  if (!Array.isArray(expectedIds) || new Set(expectedIds).size !== expectedIds.length ||
      expectedIds.some((id) => typeof id !== "string" || !/^[A-Z]+-[0-9]{2}$/.test(id))) {
    throw new Error("repair_report_invalid_expected_rows");
  }
  const expected = new Set(expectedIds);
  if ([...rows].some((id) => !expected.has(id))) throw new Error("repair_report_unexpected_row");
  const runtimeUnexecuted = unexecuted;
  for (const id of expectedIds) {
    if (rows.has(id)) continue;
    unexecuted += 1;
    failures.push(failureRecord(shared, "tools/ai/fixtures/skirmish-v1.json",
      { group: "selection", map: "unassigned" }, { scenarioId: id }, "unknown:missing_required_row"));
  }
  const groups = new Map();
  for (const failure of failures) {
    const group = groups.get(failure.key) ?? [];
    group.push(failure);
    groups.set(failure.key, group);
  }
  const sorted = [...groups.entries()].sort((left, right) => right[1].length - left[1].length ||
    left[0].localeCompare(right[0]));
  const base = {
    schemaVersion: 1,
    status: failures.length ? "failed" : "passed",
    runId: shared.runId,
    candidate: shared.candidate,
    dirtySourceDigest: shared.dirtySourceDigest ?? null,
    manifestVersion: shared.manifestVersion,
    totals: { expected: expectedIds.length, executed: rows.size - runtimeUnexecuted,
      passed, failed: rows.size - passed - runtimeUnexecuted,
      unexecuted, failureOccurrences: failures.length, clusters: sorted.length },
    artifacts: entries.map(({ path }) => path),
    clusters: [],
    omittedClusters: 0,
    omittedFailureOccurrences: 0
  };
  for (const [key, members] of sorted) {
    const first = members[0];
    const cluster = {
      key: brief(key, 220), classification: first.classification, count: members.length,
      affectedIds: [...new Set(members.map((member) => member.scenarioId))].slice(0, 40),
      omittedIds: Math.max(0, new Set(members.map((member) => member.scenarioId)).size - 40),
      representative: { scenarioId: first.scenarioId, variantId: first.variantId, seed: first.seed,
        repetition: first.repetition,
        failedPredicate: first.code, lastObserved: first.observed, stopReason: first.stopReason,
        artifact: first.path,
        rerunScenario: `node tools/ai/run-skirmish-matrix.mjs --scenario ${first.scenarioId} --mode runtime` +
          (Number.isSafeInteger(first.seed) ? ` --seed ${first.seed}` : ""),
        rerunVariant: /^[A-Za-z0-9._-]{1,100}$/.test(first.variantId) && first.variantId !== "unknown" &&
          Number.isSafeInteger(first.repetition)
          ? `node tools/ai/run-skirmish-matrix.mjs --scenario ${first.scenarioId} --mode runtime` +
            ` --variant ${first.variantId} --repetition ${first.repetition}` +
            (Number.isSafeInteger(first.seed) ? ` --seed ${first.seed}` : "")
          : null }
    };
    const withCluster = { ...base, clusters: [...base.clusters, cluster] };
    if (base.clusters.length >= maxClusters || Buffer.byteLength(JSON.stringify(withCluster)) > maxBytes) {
      base.omittedClusters += 1;
      base.omittedFailureOccurrences += members.length;
    } else base.clusters.push(cluster);
  }
  if (Buffer.byteLength(JSON.stringify(base)) > maxBytes) throw new Error("repair_report_limit_too_small_for_provenance");
  return base;
}
