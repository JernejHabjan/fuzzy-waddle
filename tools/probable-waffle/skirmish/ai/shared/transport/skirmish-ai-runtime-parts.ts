import type { RuntimeArtifactDocument } from "../../contracts/reports/runtime-artifact-document.ts";
import { copyFileSync, existsSync, linkSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { decodeRuntimeArtifact, encodeRuntimeArtifact } from "./skirmish-ai-runtime-artifact-codec.ts";

const externalEncoding = "external-runtime-variants";

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function retainVariantFile(source: string, destination: string): void {
  try {
    linkSync(source, destination);
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
    if (!["EXDEV", "EACCES", "EPERM", "ENOTSUP", "EOPNOTSUPP"].includes(String(code))) throw error;
    copyFileSync(source, destination);
  }
}

export function runtimePartsDirectory(artifactPath: string): string {
  return `${artifactPath}.parts`;
}

export function runtimePartPath(artifactPath: string, partIndex: number): string {
  return join(runtimePartsDirectory(artifactPath), `part-${String(partIndex).padStart(4, "0")}.json`);
}

/** Persist one fixture-test's result independently so later timeouts or worker restarts keep prior work. */
export function writeRuntimePart(artifactPath: string, partIndex: number, report: RuntimeArtifactDocument): string {
  const directory = runtimePartsDirectory(artifactPath);
  mkdirSync(directory, { recursive: true });
  const path = runtimePartPath(artifactPath, partIndex);
  writeFileSync(path, JSON.stringify(encodeRuntimeArtifact(report, path)));
  return path;
}

/** Merge incremental part artifacts into a single runtime artifact, hard-linking external variant files. */
export function assembleRuntimeParts(
  artifactPath: string,
  metadata: {
    sourceRevision: string;
    dirtySourceDigest: string | null;
    fixtureDigest: string;
    diagnosticSelection: unknown;
  }
): RuntimeArtifactDocument | null {
  const directory = runtimePartsDirectory(artifactPath);
  if (!existsSync(directory)) return null;
  const partFiles = readdirSync(directory)
    .filter((name) => /^part-\d+\.json$/.test(name))
    .sort();
  if (partFiles.length === 0) return null;

  const partPaths = partFiles.map((name) => join(directory, name));
  const decodedParts = partPaths.map((path) => ({
    path,
    report: decodeRuntimeArtifact(JSON.parse(readFileSync(path, "utf8")), path, {
      expandExternalVariants: false
    }) as RuntimeArtifactDocument
  }));
  return mergeEncodedRuntimeReports(artifactPath, decodedParts, metadata);
}

/** Combine multiple runtime reports (parts or shards) into one artifact without expanding external variant payloads. */
export function mergeEncodedRuntimeReports(
  destinationPath: string,
  sources: readonly { path: string; report: RuntimeArtifactDocument }[],
  metadata: {
    sourceRevision: string;
    dirtySourceDigest: string | null;
    fixtureDigest: string;
    diagnosticSelection: unknown;
  }
): RuntimeArtifactDocument | null {
  if (sources.length === 0) return null;
  const anyExternal = sources.some(({ report }) => report.artifactEncoding === externalEncoding);
  const scenarios: { scenarioId: string; passed: boolean; failures: string[]; variants: unknown[] }[] = [];
  let decisions = 0;
  let ticks = 0;
  const variantFiles: string[] = [];
  const variantSummaries: { checkpoints: Record<string, unknown>[] }[] = [];
  const destinationVariantsDir = `${destinationPath}.variants`;
  if (anyExternal) mkdirSync(destinationVariantsDir, { recursive: true });

  for (const { path, report } of sources) {
    const work: Record<string, unknown> = isRecord(report.workCounts) ? report.workCounts : {};
    decisions += typeof work.decisions === "number" ? work.decisions : 0;
    ticks += typeof work.ticks === "number" ? work.ticks : 0;
    const partScenarios = Array.isArray(report.scenarios) ? report.scenarios : [];

    if (!anyExternal) {
      const expanded = decodeRuntimeArtifact(report, path, { expandExternalVariants: true }) as RuntimeArtifactDocument;
      for (const scenario of Array.isArray(expanded.scenarios) ? expanded.scenarios : []) {
        scenarios.push(scenario as { scenarioId: string; passed: boolean; failures: string[]; variants: unknown[] });
      }
      continue;
    }

    if (report.artifactEncoding === externalEncoding) {
      const sourceVariantsDir = `${path}.variants`;
      const sourceFiles = Array.isArray(report.artifactVariantFiles) ? report.artifactVariantFiles : [];
      const sourceSummaries = Array.isArray(report.artifactVariantSummaries) ? report.artifactVariantSummaries : [];
      const indexMap = new Map<number, number>();
      for (const scenario of partScenarios) {
        const remapped = (Array.isArray(scenario.variants) ? scenario.variants : []).map((rawIndex: unknown) => {
          const idx = Number(rawIndex);
          if (!indexMap.has(idx)) {
            const sourceFile = sourceFiles[idx];
            if (!sourceFile) throw new Error("runtime_result_artifact_external_reference_invalid");
            const nextIndex = variantFiles.length;
            const fileName = `variant-${nextIndex}.json`;
            retainVariantFile(join(sourceVariantsDir, sourceFile), join(destinationVariantsDir, fileName));
            variantFiles.push(fileName);
            variantSummaries.push(sourceSummaries[idx] ?? { checkpoints: [] });
            indexMap.set(idx, nextIndex);
          }
          return indexMap.get(idx);
        });
        scenarios.push({
          scenarioId: String(scenario.scenarioId),
          passed: Boolean(scenario.passed),
          failures: Array.isArray(scenario.failures) ? scenario.failures.map(String) : [],
          variants: remapped
        });
      }
    } else {
      const expanded = decodeRuntimeArtifact(report, path, { expandExternalVariants: true }) as RuntimeArtifactDocument;
      const inlineMap = new Map<unknown, number>();
      for (const scenario of Array.isArray(expanded.scenarios) ? expanded.scenarios : []) {
        const remapped = (Array.isArray(scenario.variants) ? scenario.variants : []).map((variant: unknown) => {
          if (!inlineMap.has(variant)) {
            const nextIndex = variantFiles.length;
            const fileName = `variant-${nextIndex}.json`;
            writeFileSync(join(destinationVariantsDir, fileName), JSON.stringify(variant));
            variantFiles.push(fileName);
            variantSummaries.push(summarizeInlineVariant(variant));
            inlineMap.set(variant, nextIndex);
          }
          return inlineMap.get(variant);
        });
        scenarios.push({
          scenarioId: String(scenario.scenarioId),
          passed: Boolean(scenario.passed),
          failures: Array.isArray(scenario.failures) ? scenario.failures.map(String) : [],
          variants: remapped
        });
      }
    }
  }

  const allPassed = scenarios.length > 0 && scenarios.every((scenario) => scenario.passed);
  const status = metadata.diagnosticSelection
    ? allPassed
      ? "diagnostic_passed"
      : "diagnostic_failed"
    : allPassed
      ? "passed"
      : "failed";

  const base: RuntimeArtifactDocument = {
    schemaVersion: 1,
    sourceRevision: metadata.sourceRevision,
    dirtySourceDigest: metadata.dirtySourceDigest,
    fixtureDigest: metadata.fixtureDigest,
    status,
    diagnosticSelection: metadata.diagnosticSelection ?? null,
    scenarios,
    workCounts: { scenarios: scenarios.length, decisions, ticks }
  };

  const finalReport: RuntimeArtifactDocument =
    anyExternal && variantFiles.length > 0
      ? {
          ...base,
          artifactEncoding: externalEncoding,
          artifactVariantFiles: variantFiles,
          artifactVariantSummaries: variantSummaries
        }
      : encodeRuntimeArtifact(base, destinationPath);

  writeFileSync(destinationPath, JSON.stringify(finalReport));
  return finalReport;
}

function summarizeInlineVariant(
  variant: unknown
): { checkpoints: Record<string, unknown>[] } & Record<string, unknown> {
  if (!isRecord(variant)) return { checkpoints: [] };
  const checkpoints = Array.isArray(variant.checkpoints) ? variant.checkpoints : [];
  const lastCheckpoint = isRecord(checkpoints.at(-1)) ? checkpoints.at(-1) : {};
  return {
    variantId: variant.variantId,
    seed: variant.seed,
    stopReason: variant.stopReason,
    aiErrors: variant.aiErrors,
    timing: variant.timing,
    perturbations: variant.perturbations,
    checkpoints: [lastCheckpoint]
  };
}
