import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import type { AiResourceInputRead } from "./ai-resource-input-read";

const reads = new WeakMap<AiObservationV1, AiResourceInputRead>();

/** Detached, unsaved diagnostics keyed by actual consumed observation identity. Copies/restores cannot borrow a read. */
export function rememberAiResourceInputRead(observation: AiObservationV1, read: AiResourceInputRead): void {
  try { reads.set(observation, structuredClone(read)); } catch { /* Missing input stays unsupported. */ }
}

export function readAiResourceInputRead(observation: AiObservationV1): AiResourceInputRead | undefined {
  try { const read = reads.get(observation); return read ? structuredClone(read) : undefined; }
  catch { return undefined; }
}
