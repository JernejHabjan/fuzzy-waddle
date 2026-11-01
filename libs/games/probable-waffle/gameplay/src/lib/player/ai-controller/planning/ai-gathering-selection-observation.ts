import type { AiIntent } from "../contracts/ai-intent";
import type { AiGatheringSelection } from "./ai-gathering-selection";

/** Weak proposal identity survives arbitration by reference; rejected/copied/saved intents cannot borrow another input. */
const selections = new WeakMap<AiIntent, AiGatheringSelection>();

/** Diagnostic failure never changes proposal acceptance. No live state, callback or strong intent history is retained. */
export function rememberAiGatheringSelection(intent: AiIntent, selection: () => AiGatheringSelection): void {
  try { selections.set(intent, structuredClone(selection())); } catch { /* Missing evidence stays unavailable. */ }
}

/** Read before the dispatcher's detached clone. A restored or synthetic intent has no selection authority. */
export function readAiGatheringSelection(intent: AiIntent): AiGatheringSelection | undefined {
  try {
    const selection = selections.get(intent);
    return selection ? structuredClone(selection) : undefined;
  } catch { return undefined; }
}
