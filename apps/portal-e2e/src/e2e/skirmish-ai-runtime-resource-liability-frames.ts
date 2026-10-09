export interface RuntimeResourceLiabilityFramesV1 {
  readonly consumedReserved: number | null;
  readonly beforeSelectionReserved: number | null;
  readonly acceptingReserved: number | null;
  readonly status: "matching" | "accepting_changed" | "unavailable";
  readonly gaps: readonly string[];
}
