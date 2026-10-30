import { closeSync, copyFileSync, existsSync, mkdirSync, openSync, readFileSync, statSync, writeSync } from "node:fs";
import { join } from "node:path";

const encoding = "shared-runtime-variants-v1";
const externalEncoding = "external-runtime-variants-v1";
const maxVariantBytes = 1024 * 1024 * 1024;
const maxInlineVariantBytes = 8 * 1024 * 1024;

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function summarizeExternalVariant(variant) {
  const checkpoint = variant.checkpoints?.at(-1) ?? {};
  const checkpointFields = [
    "tick", "gameResult", "workerCount", "militaryActorNames", "deliveredIncome", "scoreMetrics",
    "resourceStockpiles", "ownedConstruction", "workerOrders", "militaryProducerQueues", "squads",
    "missionTimeline", "terminalFailureReasons"
  ];
  const finalCheckpoint = Object.fromEntries(
    checkpointFields.filter((field) => checkpoint[field] !== undefined).map((field) => [field, checkpoint[field]])
  );
  return {
    variantId: variant.variantId,
    seed: variant.seed,
    stopReason: variant.stopReason,
    aiErrors: variant.aiErrors,
    timing: variant.timing,
    perturbations: variant.perturbations,
    checkpoints: [finalCheckpoint]
  };
}

function jsonStringBytes(value) {
  let bytes = Buffer.byteLength(value, "utf8") + 2;
  for (let index = 0; index < value.length; index++) {
    const code = value.charCodeAt(index);
    if (code === 34 || code === 92) bytes++;
    else if (code < 32) bytes += [8, 9, 10, 12, 13].includes(code) ? 1 : 5;
  }
  return bytes;
}

/** Stops once a single inline variant is too large; unlike JSON.stringify this never allocates its full text. */
function exceedsInlineLimit(root) {
  const pending = [root];
  let bytes = 0;
  const add = (amount) => {
    bytes += amount;
    return bytes > maxInlineVariantBytes;
  };
  while (pending.length > 0) {
    const value = pending.pop();
    if (value === null) {
      if (add(4)) return true;
    } else if (typeof value === "string") {
      if (add(jsonStringBytes(value))) return true;
    } else if (typeof value === "number") {
      if (add(Number.isFinite(value) ? String(value).length : 4)) return true;
    } else if (typeof value === "boolean") {
      if (add(value ? 4 : 5)) return true;
    } else if (Array.isArray(value)) {
      if (add(2 + Math.max(0, value.length - 1))) return true;
      for (let index = value.length - 1; index >= 0; index--) pending.push(value[index]);
    } else if (isRecord(value)) {
      const entries = Object.entries(value).filter(([, entry]) =>
        entry !== undefined && typeof entry !== "function" && typeof entry !== "symbol"
      );
      if (add(2 + Math.max(0, entries.length - 1))) return true;
      for (let index = entries.length - 1; index >= 0; index--) {
        const [key, entry] = entries[index];
        if (add(jsonStringBytes(key) + 1)) return true;
        pending.push(entry);
      }
    } else if (add(4)) return true;
  }
  return false;
}

function writeJsonString(write, value) {
  write('"');
  for (let offset = 0; offset < value.length;) {
    let end = Math.min(offset + 16_384, value.length);
    const last = value.charCodeAt(end - 1);
    const next = value.charCodeAt(end);
    if (end < value.length && last >= 0xd800 && last <= 0xdbff && next >= 0xdc00 && next <= 0xdfff) end--;
    write(JSON.stringify(value.slice(offset, end)).slice(1, -1));
    offset = end;
  }
  write('"');
}

/** Writes JSON in small chunks so one native capture cannot exceed V8's maximum string length. */
function writeJsonFile(path, root) {
  const descriptor = openSync(path, "w");
  let pending = "";
  const flush = () => {
    if (pending.length === 0) return;
    const bytes = Buffer.from(pending, "utf8");
    let offset = 0;
    while (offset < bytes.length) offset += writeSync(descriptor, bytes, offset, bytes.length - offset);
    pending = "";
  };
  const write = (value) => {
    pending += value;
    if (pending.length >= 64 * 1024) flush();
  };
  const stack = [{ kind: "value", value: root }];
  try {
    while (stack.length > 0) {
      const entry = stack.pop();
      if (entry.kind === "text") {
        write(entry.value);
        continue;
      }
      if (entry.kind === "string") {
        writeJsonString(write, entry.value);
        continue;
      }
      const value = entry.value;
      if (value === null || typeof value === "boolean") write(JSON.stringify(value));
      else if (typeof value === "string") writeJsonString(write, value);
      else if (typeof value === "number") write(Number.isFinite(value) ? String(value) : "null");
      else if (Array.isArray(value)) {
        write("[");
        stack.push({ kind: "text", value: "]" });
        for (let index = value.length - 1; index >= 0; index--) {
          stack.push({ kind: "value", value: value[index] });
          if (index > 0) stack.push({ kind: "text", value: "," });
        }
      } else if (isRecord(value)) {
        const entries = Object.entries(value).filter(([, item]) =>
          item !== undefined && typeof item !== "function" && typeof item !== "symbol"
        );
        write("{");
        stack.push({ kind: "text", value: "}" });
        for (let index = entries.length - 1; index >= 0; index--) {
          const [key, item] = entries[index];
          stack.push({ kind: "value", value: item });
          stack.push({ kind: "text", value: ":" });
          stack.push({ kind: "string", value: key });
          if (index > 0) stack.push({ kind: "text", value: "," });
        }
      } else write("null");
    }
    flush();
  } finally {
    closeSync(descriptor);
  }
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
  const largeSingleVariant = variants.length === 1 && exceedsInlineLimit(variants[0]);
  if (artifactPath && (variants.length > 1 || largeSingleVariant)) {
    const directory = `${artifactPath}.variants`;
    mkdirSync(directory, { recursive: true });
    const files = variants.map((variant, index) => {
      const name = `variant-${index}.json`;
      writeJsonFile(join(directory, name), variant);
      return name;
    });
    return {
      ...report,
      scenarios,
      artifactEncoding: externalEncoding,
      artifactVariantFiles: files,
      artifactVariantSummaries: variants.map(summarizeExternalVariant)
    };
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
    delete inline.artifactVariantSummaries;
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
