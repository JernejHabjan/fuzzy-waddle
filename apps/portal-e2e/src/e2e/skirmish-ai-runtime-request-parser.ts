import type { RuntimeRequestV1 } from "./skirmish-ai-runtime-request";

export function parseRequest(value: string | undefined): RuntimeRequestV1 {
  if (!value) throw new Error("runtime_request_missing");
  const parsed = JSON.parse(value) as RuntimeRequestV1;
  if (
    parsed.schemaVersion !== 1 ||
    !/^[a-f0-9]{40}$/.test(parsed.sourceRevision) ||
    (parsed.dirtySourceDigest !== null && !/^fnv1a32:[a-f0-9]{8}$/.test(parsed.dirtySourceDigest)) ||
    !/^fnv1a32:[a-f0-9]{8}$/.test(parsed.fixtureDigest) ||
    (parsed.seed !== null && (!Number.isSafeInteger(parsed.seed) || parsed.seed < 0)) ||
    !Array.isArray(parsed.scenarioIds) ||
    parsed.scenarioIds.length === 0 ||
    !Array.isArray(parsed.fixtures) ||
    parsed.fixtures.length === 0
  ) {
    throw new Error("runtime_request_malformed");
  }
  return parsed;
}
