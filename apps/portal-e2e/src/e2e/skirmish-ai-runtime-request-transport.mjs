import { createHash } from "node:crypto";
import { readFileSync, statSync, writeFileSync } from "node:fs";

/** Fixtures remain local; a path avoids Linux's per-environment-variable limit for grouped native worlds. */
export const MAX_RUNTIME_REQUEST_BYTES = 8 * 1024 * 1024;

/** Own one immutable request beside the unique result artifact and bind the exact serialized fixture bytes. */
export function writeRuntimeRequest(path, request) {
  const text = JSON.stringify(request);
  if (Buffer.byteLength(text) > MAX_RUNTIME_REQUEST_BYTES) throw new Error("runtime_request_oversized");
  writeFileSync(path, text, { flag: "wx", mode: 0o600 });
  return createHash("sha256").update(text).digest("hex");
}

/** Support small legacy inline requests, but never allow ambiguous transports or an altered file. */
export function readRuntimeRequestText(environment) {
  const inline = environment.AI_SKIRMISH_RUNTIME_REQUEST;
  const path = environment.AI_SKIRMISH_RUNTIME_REQUEST_PATH;
  if (!path) {
    if (inline && Buffer.byteLength(inline) > MAX_RUNTIME_REQUEST_BYTES) throw new Error("runtime_request_oversized");
    return inline;
  }
  if (inline) throw new Error("runtime_request_ambiguous_transport");
  const digest = environment.AI_SKIRMISH_RUNTIME_REQUEST_SHA256;
  if (!/^[a-f0-9]{64}$/.test(digest ?? "")) throw new Error("runtime_request_digest_missing");
  const stat = statSync(path);
  if (!stat.isFile() || stat.size > MAX_RUNTIME_REQUEST_BYTES) throw new Error("runtime_request_oversized");
  const text = readFileSync(path, "utf8");
  if (Buffer.byteLength(text) > MAX_RUNTIME_REQUEST_BYTES) throw new Error("runtime_request_oversized");
  if (createHash("sha256").update(text).digest("hex") !== digest) throw new Error("runtime_request_digest_mismatch");
  return text;
}
