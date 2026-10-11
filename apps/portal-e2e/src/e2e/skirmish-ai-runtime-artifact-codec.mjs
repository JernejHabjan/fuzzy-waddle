const encoding = "shared-runtime-variants-v1";

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** File storage only: shared physical matches are retained once, without changing their scenario assertions. */
export function encodeRuntimeArtifact(report) {
  if (!isRecord(report)) return report;
  if (isRecord(report.runtime)) return { ...report, runtime: encodeRuntimeArtifact(report.runtime) };
  if (!Array.isArray(report.scenarios)) return report;
  const variants = [];
  const indexes = new Map();
  const scenarios = report.scenarios.map((scenario) => ({
    ...scenario,
    variants: scenario.variants.map((variant) => {
      if (!indexes.has(variant)) {
        indexes.set(variant, variants.length);
        variants.push(variant);
      }
      return indexes.get(variant);
    })
  }));
  // Keep single-scenario and old file consumers unchanged when no repeated physical capture exists.
  if (indexes.size === report.scenarios.reduce((sum, scenario) => sum + scenario.variants.length, 0)) return report;
  return { ...report, scenarios, artifactEncoding: encoding, artifactVariants: variants };
}

/** Expand checked storage references to shared objects; legacy inline V1 reports are returned unchanged. */
export function decodeRuntimeArtifact(report) {
  if (!isRecord(report)) return report;
  if (isRecord(report.runtime)) return { ...report, runtime: decodeRuntimeArtifact(report.runtime) };
  if (report.artifactEncoding === undefined) return report;
  if (
    report.artifactEncoding !== encoding ||
    report.schemaVersion !== 1 ||
    !Array.isArray(report.scenarios) ||
    !Array.isArray(report.artifactVariants) ||
    !report.artifactVariants.every(isRecord)
  ) {
    throw new Error("runtime_result_artifact_encoding_invalid");
  }
  const artifactVariants = report.artifactVariants;
  const inline = { ...report };
  delete inline.artifactEncoding;
  delete inline.artifactVariants;
  const used = new Set();
  const scenarios = report.scenarios.map((scenario) => {
    if (!isRecord(scenario) || !Array.isArray(scenario.variants)) {
      throw new Error("runtime_result_artifact_reference_invalid");
    }
    return {
      ...scenario,
      variants: scenario.variants.map((index) => {
        if (!Number.isSafeInteger(index) || index < 0 || index >= artifactVariants.length) {
          throw new Error("runtime_result_artifact_reference_invalid");
        }
        used.add(index);
        return artifactVariants[index];
      })
    };
  });
  if (used.size !== artifactVariants.length) throw new Error("runtime_result_artifact_unreferenced_variant");
  return { ...inline, scenarios };
}
