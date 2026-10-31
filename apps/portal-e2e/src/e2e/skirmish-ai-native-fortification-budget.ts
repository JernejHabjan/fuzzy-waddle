import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { nativeScenarioContext } from "./skirmish-ai-native-scenario-context";
import { runtimeResourceCreditMatches } from "./skirmish-ai-runtime-resource-service-validation";

/** Native money plus reconciled unspent commitments, across every plan/base identity, including lost and unfinished sites. */
export function nativeFortificationBudgetFailures(
  context: ReturnType<typeof nativeScenarioContext>, allowEarnedIncome = false
): string[] {
  const first = context.frames[0]?.decision.input?.resources;
  if (!first || first.length !== 4) return ["fortification_fixed_budget_native_ledger_missing"];
  const envelope = new Map(first.map((resource) => [resource.resourceType,
    Math.max(0, resource.stockpile - resource.reservedUnspent - resource.obligationsDue)]));
  const cap = new Map(first.map((resource) => [resource.resourceType, Math.floor((envelope.get(resource.resourceType) ?? 0) * 0.2)]));
  const spent = new Map<ResourceType, number>(), failures: string[] = [];
  if (!allowEarnedIncome && context.capture?.setup?.actors.some((actor) => actor.definition.resourceSource &&
      actor.definition.resourceSource.currentResources !== 0))
    failures.push("fortification_fixed_budget_has_undepleted_native_source");
  const sites = new Set(context.facts.flatMap((fact) => fact.kind === "spatial_authority" && fact.spatial.kind === "placement" &&
    fact.spatial.command.execution?.source === "ai" && fact.spatial.site.playerNumber === 2 &&
    ["Wall", "Stairs", "WatchTower"].includes(fact.spatial.site.canonicalObjectName) && fact.spatial.site.actorId
    ? [fact.spatial.site.actorId] : []));
  for (const fact of context.capture?.facts ?? []) {
    // Continuous recovery may earn a larger envelope, but only an independently attributed native delivery can fund it.
    if (allowEarnedIncome && fact.tick > (context.frames[0]?.tick ?? Infinity) && fact.kind === "spatial_authority" &&
      fact.spatial.kind === "resource_service" && fact.spatial.phase === "resource_credit" &&
      fact.spatial.beneficiary === 2 && fact.spatial.resourceType && runtimeResourceCreditMatches(fact.spatial)) {
      const resource = fact.spatial.resourceType;
      envelope.set(resource, (envelope.get(resource) ?? 0) + fact.spatial.amount);
      cap.set(resource, Math.floor((envelope.get(resource) ?? 0) * 0.2));
    }
    if (fact.kind === "construction_authority" && fact.construction.kind === "resource" &&
        sites.has(fact.construction.site.actorId ?? "") && fact.construction.status === "returned") {
      const charge = fact.construction, sign = charge.operation === "start_charge" ? 1 : -1;
      if (!charge.balanceMatches || charge.callbackCount !== 1 || charge.nestedEmission ||
          charge.snapshotRestoreInProgress || !charge.sceneActive || charge.clockTick !== fact.tick ||
          charge.ownerArgument !== 2 || !charge.requested || !charge.before || !charge.after) {
        failures.push("fortification_native_payment_or_refund_authority_incomplete");
        continue;
      }
      for (const resource of Object.values(ResourceType)) {
        const amount = charge.requested[resource] ?? 0;
        if (!Number.isFinite(amount) || amount < 0 || charge.after[resource] !== charge.before[resource] - sign * amount)
          failures.push("fortification_native_payment_or_refund_vector_mismatch");
        spent.set(resource, (spent.get(resource) ?? 0) + sign * amount);
      }
    }
    const unspent = fact.boundaryState?.unspentClaims;
    if (!unspent) continue;
    if (unspent.resources === null || unspent.gaps.length) { failures.push("fortification_unspent_authority_incomplete"); continue; }
    const committed = new Map<ResourceType, number>();
    for (const entry of unspent.entries) {
      if (!["selected", "admitted"].includes(entry.state) || entry.intent.kind !== "construct" ||
          !["Wall", "Stairs", "WatchTower"].includes(entry.intent.objectName)) continue;
      for (const claim of entry.intent.claims) if (claim.kind === "resource")
        committed.set(claim.resourceType, (committed.get(claim.resourceType) ?? 0) + claim.amount);
    }
    for (const resource of Object.values(ResourceType))
      if ((spent.get(resource) ?? 0) + (committed.get(resource) ?? 0) > (cap.get(resource) ?? 0))
        failures.push("fortification_cumulative_paid_and_unspent_cost_exceeds_fixed_budget");
  }
  return [...new Set(failures)];
}
