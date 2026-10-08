import { isDeepStrictEqual } from "node:util";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { RuntimeResourceNeedV1 } from "./skirmish-ai-runtime-resource-need";

/** Validate every supplied tail before exposing a bounded group. Newer forecast snapshots never supply selection authority. */
export function normalizeRuntimeResourceNeeds(capture: AiRuntimeProductionCaptureV1) {
  const failures: string[] = [], gaps = new Set<string>(), needs: RuntimeResourceNeedV1[] = [];
  let count = 0;
  for (const fact of capture.facts) {
    if (fact.kind !== "decision_selected") continue;
    const selections = fact.decision.gatheringSelections;
    if (!selections) {
      if (fact.decision.acceptedIntents.some((intent) => intent.kind === "assign_gatherers")) {
        gaps.add("production_resource_selection_authority_missing");
      }
      continue;
    }
    const seen = new Set<string>();
    for (const selection of selections) {
      count++;
      if (!selection || typeof selection !== "object" || selection.forecast === undefined || selection.ledger === undefined) {
        failures.push("production_resource_selection_invalid"); continue;
      }
      const intent = fact.decision.acceptedIntents.filter((entry) => entry.intentId === selection.intentId &&
        entry.effectId === selection.effectId);
      const nonnegative = (value: number) => Number.isFinite(value) && value >= 0;
      const integer = (value: number) => Number.isSafeInteger(value) && value >= 0;
      const ledger = selection.ledger, forecast = selection.forecast, income = ledger?.deliveredIncomePerMinute;
      const marker = selection.resourceInputRead;
      const invalid = seen.has(selection.intentId) || intent.length !== 1 || intent[0].kind !== "assign_gatherers" ||
        !fact.decision.decisions.some((entry) => entry.outcome === "accepted" && entry.reason === "accepted" &&
          isDeepStrictEqual(entry.intent, intent[0])) ||
        intent[0].resourceType !== selection.resourceType || selection.playerNumber !== fact.playerNumber ||
        intent[0].proposedTick !== selection.tick ||
        selection.playerNumber !== fact.decision.identity.playerNumber || selection.tick !== fact.decision.identity.tick ||
        selection.observationGeneration !== fact.decision.identity.generation ||
        selection.catalogGeneration !== selection.observationGeneration ||
        fact.decision.input?.capabilityCatalog !== null && fact.decision.input?.capabilityCatalog !== undefined &&
          fact.decision.input.capabilityCatalog.generation !== selection.catalogGeneration ||
        !integer(selection.tick) || !integer(selection.observationGeneration) || !integer(selection.catalogGeneration) ||
        marker !== undefined && (marker === null || marker.captureEpoch !== 1 || !integer(marker.lossEpoch) ||
          marker.lossEpoch > 8192 || !integer(marker.sequence) || marker.sequence === 0 || marker.sequence >= fact.sequence ||
          marker.playerNumber !== selection.playerNumber || marker.generation !== selection.observationGeneration) ||
        !Object.values(ResourceType).includes(selection.resourceType) ||
        !["forecast", "stockpile_fallback"].includes(selection.branch) ||
        (selection.branch === "forecast") !== (forecast !== null) ||
        ledger !== null && (ledger.resourceType !== selection.resourceType ||
          ![ledger.stockpile, ledger.reservedUnspent, ledger.obligationsDue].every(nonnegative) ||
          !income || !["known", "unknown"].includes(income.status) || income.status === "known" &&
            (!nonnegative(income.value) || !integer(income.observedTick) || income.observedTick > selection.tick)) ||
        forecast !== null && (!nonnegative(forecast.amount) || !integer(forecast.horizonTick) ||
          !integer(forecast.confidencePermille) || forecast.confidencePermille > 1000 ||
          selection.plannerDeficit === null || !Number.isFinite(selection.plannerDeficit)) ||
        forecast === null && selection.plannerDeficit !== null;
      seen.add(selection.intentId);
      if (invalid) { failures.push("production_resource_selection_invalid"); continue; }
      if (forecast && ledger) {
        const horizon = Math.max(0, Math.min(600, forecast.horizonTick - selection.tick));
        const predicted = income?.status === "known" ? income.value * horizon / 1200 : 0;
        const expected = forecast.amount - (ledger.stockpile - ledger.reservedUnspent - ledger.obligationsDue) - predicted;
        if (!Number.isFinite(expected) || expected !== selection.plannerDeficit) {
          failures.push("production_resource_selection_deficit_mismatch"); continue;
        }
      }
      const entryGaps: string[] = [];
      const gross = forecast && ledger
        ? Math.max(0, forecast.amount - Math.max(0, ledger.stockpile - ledger.reservedUnspent - ledger.obligationsDue)) : null;
      const quantitative = gross !== null && Number.isFinite(gross) && gross > 0 && forecast &&
        forecast.confidencePermille > 0 && forecast.horizonTick > selection.tick &&
        selection.plannerDeficit !== null && selection.plannerDeficit > 0;
      if (!quantitative) entryGaps.push("production_resource_dated_positive_need_missing");
      if (income?.status !== "known") entryGaps.push("production_resource_empirical_income_unknown");
      if (count <= 256) needs.push({ selectedSequence: fact.sequence, selection,
        grossUnmet: quantitative ? gross : null, gaps: entryGaps });
      entryGaps.forEach((gap) => gaps.add(gap));
    }
    if (fact.decision.acceptedIntents.some((intent) => intent.kind === "assign_gatherers" && !seen.has(intent.intentId))) {
      gaps.add("production_resource_selection_authority_missing");
    }
  }
  if (count > 256) failures.push("production_resource_selection_overflow");
  return { needs: failures.length ? [] : structuredClone(needs), failures: [...new Set(failures)], gaps: [...gaps] };
}
