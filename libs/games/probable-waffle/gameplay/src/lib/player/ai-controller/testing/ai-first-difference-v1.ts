import { canonicalizeAiValue } from "../brain/canonical-ai-serialization";
import type { AiScenarioRunReportV1 } from "./ai-scenario-v1";

/** First normalized difference used by determinism, replay and debug comparison. */
export interface AiFirstDifferenceV1 {
  readonly path: string;
  readonly expected: unknown;
  readonly actual: unknown;
}

/** Returns the first canonical field difference; object key and array order are deterministic. */
export function findFirstAiDifferenceV1(expected: unknown, actual: unknown): AiFirstDifferenceV1 | null {
  const left = canonicalizeAiValue(expected);
  const right = canonicalizeAiValue(actual);
  return walk(left, right, "$");
}

/** Locates the first divergent simulation tick before returning its normalized retained field path. */
export function compareAiScenarioReportsV1(
  expected: AiScenarioRunReportV1,
  actual: AiScenarioRunReportV1
): { readonly tick: number | null; readonly difference: AiFirstDifferenceV1 } | null {
  const count = Math.max(expected.records.length, actual.records.length);
  for (let index = 0; index < count; index += 1) {
    const left = expected.records[index];
    const right = actual.records[index];
    if (!left || !right) {
      return {
        tick: left?.tick ?? right?.tick ?? null,
        difference: { path: `$.records[${index}]`, expected: left, actual: right }
      };
    }
    const difference = findFirstAiDifferenceV1(left.diagnosticState ?? left, right.diagnosticState ?? right);
    if (difference) return { tick: Math.min(left.tick, right.tick), difference };
  }
  const difference = findFirstAiDifferenceV1(
    { ai: expected.finalAiDigest, world: expected.finalWorldDigest },
    { ai: actual.finalAiDigest, world: actual.finalWorldDigest }
  );
  return difference ? { tick: expected.records.at(-1)?.tick ?? actual.records.at(-1)?.tick ?? null, difference } : null;
}

function walk(expected: unknown, actual: unknown, path: string): AiFirstDifferenceV1 | null {
  if (Object.is(expected, actual)) return null;
  if (Array.isArray(expected) && Array.isArray(actual)) {
    const count = Math.max(expected.length, actual.length);
    for (let index = 0; index < count; index += 1) {
      const difference = walk(expected[index], actual[index], `${path}[${index}]`);
      if (difference) return difference;
    }
    return null;
  }
  if (isRecord(expected) && isRecord(actual)) {
    const keys = [...new Set([...Object.keys(expected), ...Object.keys(actual)])].sort();
    for (const key of keys) {
      const difference = walk(expected[key], actual[key], `${path}.${key}`);
      if (difference) return difference;
    }
    return null;
  }
  return { path, expected, actual };
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
