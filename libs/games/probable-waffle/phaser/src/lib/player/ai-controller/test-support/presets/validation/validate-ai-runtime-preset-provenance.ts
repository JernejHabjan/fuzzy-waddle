import { isRecord, hasOnlyKeys } from "../../harness/fixtures/ai-runtime-fixture-values";

/** Shared pure preflight for the identity accepted by the native preset boundary. */
export function validAiRuntimePresetProvenance(value: unknown): boolean {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, ["sourceRevision", "fixtureDigest"]) &&
    typeof value["sourceRevision"] === "string" &&
    /^[a-f0-9]{40}$/.test(value["sourceRevision"]) &&
    typeof value["fixtureDigest"] === "string" &&
    /^fnv1a32:[a-f0-9]{8}$/.test(value["fixtureDigest"])
  );
}
