import type { AiObservation } from "../../../contracts/observation/ai-observation";
import type { AiResourceInputRead } from "./ai-resource-input-read";

const reads = new WeakMap<AiObservation, AiResourceInputRead>();

/** Detached, unsaved diagnostics keyed by actual consumed observation identity. Copies/restores cannot borrow a read. */
export function rememberAiResourceInputRead(observation: AiObservation, read: AiResourceInputRead): void {
  try { reads.set(observation, structuredClone(read)); } catch { /* Missing input stays unsupported. */ }
}

export function readAiResourceInputRead(observation: AiObservation): AiResourceInputRead | undefined {
  try { const read = reads.get(observation); return read ? structuredClone(read) : undefined; }
  catch { return undefined; }
}
