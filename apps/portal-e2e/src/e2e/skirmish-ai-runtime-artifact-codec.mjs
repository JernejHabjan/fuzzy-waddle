import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const encoding = "shared-runtime-variants-v1";
const externalEncoding = "external-runtime-variants-v1";
const maxVariantBytes = 512 * 1024 * 1024;

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** File storage only: shared physical matches are retained once, without changing their scenario assertions. */
export function encodeRuntimeArtifact(report, artifactPath) {
  if (!isRecord(report)) return report;
  if (isRecord(report.runtime)) {
    const runtime = report.runtime;
    if (runtime.artifactEncoding === externalEncoding && runtime.__artifactSourcePath) {
      const destination = `${artifactPath}.variants`;
      mkdirSync(destination, { recursive: true });
      for (const file of runtime.artifactVariantFiles ?? [])
        copyFileSync(join(`${runtime.__artifactSourcePath}.variants`, file), join(destination, file));
      const copy = { ...runtime };
      delete copy.__artifactSourcePath;
      return { ...report, runtime: copy };
    }
    return { ...report, runtime: encodeRuntimeArtifact(runtime, artifactPath) };
  }
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
  const totalVariants = report.scenarios.reduce((sum, scenario) => sum + scenario.variants.length, 0);
  if (artifactPath && variants.length > 1) {
    const directory = `${artifactPath}.variants`;
    mkdirSync(directory, { recursive: true });
    const files = variants.map((variant, index) => {
      const name = `variant-${index}.json`;
      writeFileSync(join(directory, name), JSON.stringify(variant));
      return name;
    });
    return { ...report, scenarios, artifactEncoding: externalEncoding, artifactVariantFiles: files };
  }
  if (indexes.size === totalVariants) return report;
  return { ...report, scenarios, artifactEncoding: encoding, artifactVariants: variants };
}

/** Expand checked storage references to shared objects; legacy inline V1 reports are returned unchanged. */
export function decodeRuntimeArtifact(report, artifactPath, options = {}) {
  if (!isRecord(report)) return report;
  if (isRecord(report.runtime))
    return { ...report, runtime: decodeRuntimeArtifact(report.runtime, artifactPath, options) };
  if (report.artifactEncoding === undefined) return report;
  if (report.artifactEncoding === externalEncoding) {
    if (
      report.schemaVersion !== 1 ||
      !Array.isArray(report.scenarios) ||
      !Array.isArray(report.artifactVariantFiles) ||
      !artifactPath ||
      !report.artifactVariantFiles.every((file, index) => file === `variant-${index}.json`)
    )
      throw new Error("runtime_result_artifact_external_reference_invalid");
    const files = report.artifactVariantFiles;
    if (options.expandExternalVariants === false) {
      for (const file of files) {
        const path = join(`${artifactPath}.variants`, file);
        if (!existsSync(path) || statSync(path).size > maxVariantBytes)
          throw new Error("runtime_result_artifact_external_variant_missing_or_oversized");
      }
      const used = new Set();
      for (const scenario of report.scenarios) {
        if (!isRecord(scenario) || !Array.isArray(scenario.variants))
          throw new Error("runtime_result_artifact_external_reference_invalid");
        for (const index of scenario.variants) {
          if (!Number.isSafeInteger(index) || index < 0 || index >= files.length)
            throw new Error("runtime_result_artifact_external_reference_invalid");
          used.add(index);
        }
      }
      if (used.size !== files.length) throw new Error("runtime_result_artifact_external_variant_unreferenced");
      Object.defineProperty(report, "__artifactSourcePath", { value: artifactPath });
      return report;
    }
    const artifactVariants = files.map((file) => {
      const path = join(`${artifactPath}.variants`, file);
      if (!existsSync(path) || statSync(path).size > maxVariantBytes)
        throw new Error("runtime_result_artifact_external_variant_missing_or_oversized");
      const variant = JSON.parse(readFileSync(path, "utf8"));
      if (!isRecord(variant)) throw new Error("runtime_result_artifact_external_variant_invalid");
      return variant;
    });
    const inline = { ...report };
    delete inline.artifactEncoding;
    delete inline.artifactVariantFiles;
    const used = new Set();
    const scenarios = report.scenarios.map((scenario) => {
      if (!isRecord(scenario) || !Array.isArray(scenario.variants))
        throw new Error("runtime_result_artifact_external_reference_invalid");
      return {
        ...scenario,
        variants: scenario.variants.map((index) => {
          if (!Number.isSafeInteger(index) || index < 0 || index >= artifactVariants.length)
            throw new Error("runtime_result_artifact_external_reference_invalid");
          used.add(index);
          return artifactVariants[index];
        })
      };
    });
    if (used.size !== artifactVariants.length) throw new Error("runtime_result_artifact_external_variant_unreferenced");
    return { ...inline, scenarios };
  }
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
