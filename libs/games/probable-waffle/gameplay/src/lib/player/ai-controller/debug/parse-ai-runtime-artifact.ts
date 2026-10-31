import { AiReproBundleValidationError, parseAiReproBundleV1 } from "./parse-ai-repro-bundle";
import { digestAiReproJson } from "./ai-repro-json-digest";

/** Explicit runtime-import boundary. It reads no references, executes no payload and never applies imported state. */
export function parseAiRuntimeArtifact(json: string, access: "player" | "host" | "developer") {
  if (access === "player") throw new AiReproBundleValidationError("access_denied");
  if (new TextEncoder().encode(json).byteLength > 16 * 1024 * 1024)
    throw new AiReproBundleValidationError("oversized");
  let value: unknown;
  try { value = JSON.parse(json); }
  catch { throw new AiReproBundleValidationError("malformed_json"); }
  boundRuntimeArtifact(value);
  if (!record(value) || Object.keys(value).some((key) => key !== "manifest" && key !== "payload") ||
      !record(value.manifest) || !record(value.payload))
    throw new AiReproBundleValidationError("malformed_bundle");
  const manifest = parseAiReproBundleV1(JSON.stringify(value.manifest), { access, maxBytes: 128 * 1024 });
  if (manifest.kind !== "runtime" || manifest.privacy !== "host_confidential")
    throw new AiReproBundleValidationError("malformed_bundle");
  const payload = value.payload;
  if (!record(payload.controllerState) || !record(payload.observation) || !record(payload.authoritativeProjection) ||
      !Array.isArray(payload.outcomes) || manifest.replayInputs.snapshotDigest !== digestAiReproJson(payload) ||
      manifest.replayInputs.inputDigest !== digestAiReproJson({ observation: payload.observation, outcomes: payload.outcomes }))
    throw new AiReproBundleValidationError("malformed_bundle");
  return { manifest, payload };
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** Bound depth/counts before the manifest parser's recursive markup inspection; bytes alone do not bound recursion. */
function boundRuntimeArtifact(root: unknown) {
  const pending = [{ value: root, depth: 0 }];
  let nodes = 0;
  while (pending.length) {
    const entry = pending.pop()!;
    if (++nodes > 262144 || entry.depth > 48) throw new AiReproBundleValidationError("oversized");
    if (entry.value === null || typeof entry.value !== "object") continue;
    const children = Object.values(entry.value);
    if (children.length > 4096) throw new AiReproBundleValidationError("oversized");
    for (const value of children) pending.push({ value, depth: entry.depth + 1 });
  }
}
