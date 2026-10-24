import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { nativeScenarioContext } from "./skirmish-ai-native-scenario-context";

/** Reconstruct waiting amounts from their original selected claims, excluding actually dispatched and newly executable work. */
export function nativeWaitingExposureFailures(context: ReturnType<typeof nativeScenarioContext>) {
  const failures: string[] = [];
  for (const frame of context.frames) {
    const resources = frame.decision.input?.resources, before = frame.unspentClaimsBeforeSelection;
    if (!resources || !before?.resources || before.gaps.length) {
      failures.push("resources_waiting_exposure_original_cash_or_ownership_missing");
      continue;
    }
    const waiting = new Map<ResourceType, number>();
    for (const reservation of frame.decision.reservations) {
      if (reservation.state.kind !== "provisional" || reservation.createdTick >= frame.tick ||
          !reservation.subjectKey?.startsWith("resource:")) continue;
      const selected = context.frames.filter((entry) => entry.sequence < frame.sequence &&
        entry.tick === reservation.createdTick).flatMap((entry) =>
        entry.decision.acceptedIntents).find((intent) => intent.planId === reservation.ownerPlanId &&
          intent.claims.some((claim) => claim.claimId === reservation.claimId));
      if (!selected) { failures.push("resources_waiting_claim_original_amount_missing"); continue; }
      const dispatched = context.facts.some((fact) => fact.sequence < frame.sequence && fact.kind === "intent_dispatch" &&
        fact.event.kind === "requested" && fact.event.correlation.effectId === selected.effectId.replace(/^effect:/, ""));
      if (dispatched || selected.lane !== "optional_infrastructure_tech") continue;
      const claim = selected.claims.find((claim) => claim.claimId === reservation.claimId);
      if (claim?.kind !== "resource" || !Number.isFinite(claim.amount) || claim.amount < 0) {
        failures.push("resources_waiting_claim_amount_invalid"); continue;
      }
      waiting.set(claim.resourceType, (waiting.get(claim.resourceType) ?? 0) + claim.amount);
    }
    for (const resource of Object.values(ResourceType)) {
      const cash = resources.find((entry) => entry.resourceType === resource);
      if (!cash || !Number.isFinite(cash.stockpile) || !Number.isFinite(cash.obligationsDue)) {
        failures.push("resources_original_per_resource_denominator_missing"); continue;
      }
      const existingEssentials = before.entries.filter((entry) => ["selected", "admitted"].includes(entry.state) &&
        entry.intent.lane !== "optional_infrastructure_tech").flatMap((entry) => entry.intent.claims)
        .reduce((sum, claim) => sum + (claim.kind === "resource" && claim.resourceType === resource ? claim.amount : 0), 0);
      const newEssentials = frame.decision.acceptedIntents.filter((intent) => intent.lane !== "optional_infrastructure_tech")
        .flatMap((intent) => intent.claims)
        .reduce((sum, claim) => sum + (claim.kind === "resource" && claim.resourceType === resource ? claim.amount : 0), 0);
      const denominator = Math.max(0, cash.stockpile - cash.obligationsDue - existingEssentials - newEssentials);
      if (!Number.isFinite(denominator) || (waiting.get(resource) ?? 0) > denominator / 4)
        failures.push(`resources_player_wide_waiting_optional_exposure_exceeded:${resource}`);
    }
  }
  return [...new Set(failures)];
}
