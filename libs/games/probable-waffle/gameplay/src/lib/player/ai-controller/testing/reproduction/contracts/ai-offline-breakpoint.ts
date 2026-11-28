/** Allowed offline breakpoints; arbitrary expressions are intentionally unsupported. */
export type AiOfflineBreakpoint =
  | "duplicate_effect"
  | "progress_overdue"
  | "mission_cancelled"
  | "command_rejected"
  | "decision_complete";
