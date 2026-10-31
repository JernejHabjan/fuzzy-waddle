import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { AiRuntimeUnspentClaimsV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-unspent-claims-v1";
import type { RuntimeResourceNeedV1 } from "./skirmish-ai-runtime-resource-need";

/** Diagnostic cash frames for one exact selected need; they never replace its consumed ledger or activate useful credit. */
export interface RuntimeResourceLiabilityFramesV1 {
  /** Unspent cash at the actual planner read; null means absent, invalid or incomplete ownership. */
  readonly consumedReserved: number | null;
  /** Cash before this selection added/retired claims, independent of the saved brain view. */
  readonly beforeSelectionReserved: number | null;
  /** Cash after selection; an increase explains why the accepting frame cannot authorize the older bound. */
  readonly acceptingReserved: number | null;
  /** Matching requires exact input identity and unchanged due liabilities as well as equal cash amounts. */
  readonly status: "matching" | "accepting_changed" | "unavailable";
  /** Missing authority and mismatches remain explicit even when endpoint amounts happen to agree. */
  readonly gaps: readonly string[];
}

/** Inspect every supplied snapshot, including unselected resources and tails with no gathering need. */
export function validateRuntimeResourceLiabilityFrames(capture: AiRuntimeProductionCaptureV1): string[] {
  for (const fact of [...capture.facts, ...(capture.recipientResourceFacts ?? [])]) {
    const snapshots = [fact.boundaryState?.unspentClaims];
    if (fact.kind === "resource_input_read") snapshots.push(fact.unspentClaimsAtRead);
    if (fact.kind === "decision_selected") snapshots.push(fact.unspentClaimsBeforeSelection);
    if (fact.kind === "outcome" || fact.kind === "intent_dispatch") snapshots.push(fact.boundaryStateBefore?.unspentClaims);
    if (snapshots.some((snapshot) => snapshot !== undefined && !validSnapshot(snapshot))) {
      return ["production_need_liability_frame_value_invalid"];
    }
  }
  return [];
}

/** Project three detached frames only after the caller checked the exact read and intervening native boundaries. */
export function projectRuntimeResourceLiabilityFrames(capture: AiRuntimeProductionCaptureV1, need: RuntimeResourceNeedV1,
  read: AiRuntimeProductionCaptureV1["facts"][number] | undefined,
  selected: AiRuntimeProductionCaptureV1["facts"][number] | undefined, scopeGaps: ReadonlySet<string>)
  : RuntimeResourceLiabilityFramesV1 {
  const gaps = new Set<string>(), { resourceType: type, ledger } = need.selection;
  const consumed = read?.kind === "resource_input_read" ? read.unspentClaimsAtRead : undefined;
  const before = selected?.kind === "decision_selected" ? selected.unspentClaimsBeforeSelection : undefined;
  const state = selected?.boundaryState, accepting = state?.unspentClaims;
  const amount = (snapshot: AiRuntimeUnspentClaimsV1 | undefined): number | null =>
    snapshot && validSnapshot(snapshot) ? snapshot.resources?.[type] ?? null : null;
  const consumedReserved = amount(consumed), beforeSelectionReserved = amount(before), acceptingReserved = amount(accepting);
  if (!need.selection.resourceInputRead || read?.kind !== "resource_input_read" ||
    read.sequence !== need.selection.resourceInputRead.sequence || read.playerNumber !== need.selection.playerNumber ||
    !consumed) gaps.add("liability_consumed_frame_unavailable");
  if (selected?.kind !== "decision_selected" || selected.playerNumber !== need.selection.playerNumber ||
    selected.decision.identity.playerNumber !== need.selection.playerNumber ||
    selected.decision.identity.tick !== need.selection.tick ||
    selected.decision.identity.generation !== need.selection.observationGeneration ||
    !before) gaps.add("liability_before_selection_frame_unavailable");
  if (!state || !accepting || !validVector(state.resources) || !validVector(state.obligations) ||
    state.snapshotRestoreInProgress !== false || !Array.isArray(state.gaps) || state.gaps.length ||
    !ledger || !Number.isFinite(ledger.obligationsDue) || ledger.obligationsDue < 0 ||
    state.obligations?.[type] !== ledger.obligationsDue) gaps.add("liability_accepting_frame_unavailable");
  if ([consumed, before, accepting].some((snapshot) => snapshot && (!validSnapshot(snapshot) || snapshot.gaps.length)) ||
    capture.resourceCoverage?.lost || !capture.resourceCoverage ||
    // Only the expected accepting cash change may lack the old accounting frame; journal/input gaps still reject matching.
    [...scopeGaps].some((gap) => gap !== "production_need_reconciled_liability_frame_missing")) {
    gaps.add("liability_capture_or_snapshot_gap");
  }
  if (scopeGaps.has("production_need_exact_input_read_missing")) gaps.add("liability_consumed_input_mismatch");
  if (consumedReserved === null) gaps.add("liability_consumed_frame_unavailable");
  if (beforeSelectionReserved === null) gaps.add("liability_before_selection_frame_unavailable");
  if (acceptingReserved === null) gaps.add("liability_accepting_frame_unavailable");
  if (!ledger || !Number.isFinite(ledger.reservedUnspent) || ledger.reservedUnspent < 0) {
    gaps.add("liability_consumed_ledger_unavailable");
  } else {
    if (consumedReserved !== null && consumedReserved !== ledger.reservedUnspent) gaps.add("liability_consumed_ledger_mismatch");
    if (beforeSelectionReserved !== null && beforeSelectionReserved !== ledger.reservedUnspent) {
      gaps.add("liability_before_selection_mismatch");
    }
  }
  return { consumedReserved, beforeSelectionReserved, acceptingReserved,
    status: gaps.size ? "unavailable" : acceptingReserved === consumedReserved ? "matching" : "accepting_changed",
    gaps: [...gaps] };
}

/** Null resources are a supported gap; a supplied vector must contain every finite, nonnegative native resource. */
function validSnapshot(snapshot: AiRuntimeUnspentClaimsV1): boolean {
  if (!snapshot || !Array.isArray(snapshot.entries) || snapshot.entries.length > 512 ||
    !Array.isArray(snapshot.gaps) || snapshot.gaps.some((gap) => typeof gap !== "string" || !gap)) return false;
  return snapshot.resources === null || validVector(snapshot.resources);
}

/** Complete native vector, with no missing or unknown resource key treated as a zero amount. */
function validVector(resources: AiRuntimeUnspentClaimsV1["resources"]): boolean {
  const types = Object.values(ResourceType);
  return !!resources && !Array.isArray(resources) &&
    Object.keys(resources).every((key) => types.some((type) => type === key)) &&
    types.every((type) => typeof resources[type] === "number" && Number.isFinite(resources[type]) && resources[type] >= 0);
}
