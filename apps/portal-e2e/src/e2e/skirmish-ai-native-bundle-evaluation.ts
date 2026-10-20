import { ObjectNames, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { nativeScenarioContext } from "./skirmish-ai-native-scenario-context";
import { nativeCompletedPlacements } from "./skirmish-ai-native-construction-evidence";
import { hasNativeSourceDelivery } from "./skirmish-ai-source-delivery";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";

/** User-approved H-12: native atomic prevention, with synthetic recovery policy covered separately by pure tests. */
export function evaluateNativeBundles(branch: string, context: ReturnType<typeof nativeScenarioContext>): string[] {
  const failures: string[] = [], resources = Object.values(ResourceType);
  const sameVector = (left: Readonly<Partial<Record<ResourceType, number>>> | null | undefined,
    right: Readonly<Partial<Record<ResourceType, number>>> | null | undefined) =>
    !!left && !!right && resources.every((type) => (left[type] ?? 0) === (right[type] ?? 0));
  let contention = false;
  const contenders = new Set<ObjectNames>();
  for (const frame of context.frames) {
    const input = frame.decision.input, cash = input?.resources, catalog = input?.capabilityCatalog;
    if (!cash || !catalog) { failures.push("bundles_complete_native_budget_input_missing"); continue; }
    const available = (type: ResourceType) => {
      const row = cash.find((entry) => entry.resourceType === type);
      return row ? row.stockpile - row.reservedUnspent - row.obligationsDue : 0;
    };
    const projects = frame.decision.decisions.map((decision) => decision.intent).filter((intent) => intent.kind === "construct");
    const cost = (intent: typeof projects[number]) => catalog.entries.find((entry) =>
      entry.sourceObjectName === intent.objectName)?.constructionProfile?.resourceCost;
    for (const left of projects) for (const right of projects) {
      if (left.intentId >= right.intentId || left.objectName === right.objectName) continue;
      const a = cost(left), b = cost(right);
      if (!a || !b || !resources.every((type) => available(type) >= (a[type] ?? 0) && available(type) >= (b[type] ?? 0))) continue;
      if (!((a.wood ?? 0) + (b.wood ?? 0) > 0 && (a.stone ?? 0) + (b.stone ?? 0) > 0)) continue;
      const combinedFits = resources.every((type) => available(type) >= (a[type] ?? 0) + (b[type] ?? 0));
      if (!contention && (branch === "acyclic" ? combinedFits : !combinedFits)) {
        contention = true;
        contenders.add(left.objectName);
        contenders.add(right.objectName);
      }
    }
    for (const intent of frame.decision.acceptedIntents) {
      if (intent.kind !== "construct") continue;
      const claimed = Object.fromEntries(resources.map((type) => [type, intent.claims.reduce((sum, claim) =>
        sum + (claim.kind === "resource" && claim.resourceType === type ? claim.amount : 0), 0)]));
      if (!sameVector(claimed, cost(intent))) failures.push("bundles_partial_definition_cost_was_admitted");
    }
    for (const type of resources) {
      const admitted = frame.decision.acceptedIntents.flatMap((intent) => intent.claims).reduce((sum, claim) =>
        sum + (claim.kind === "resource" && claim.resourceType === type ? claim.amount : 0), 0);
      if (admitted > Math.max(0, available(type))) failures.push("bundles_native_shared_budget_overspent");
    }
    if (frame.decision.missionState?.waitEdges.some((edge) => edge.prerequisite.kind === "resource" && edge.toPlanId !== null) ||
        frame.decision.decisions.some((decision) => decision.outcome === "rejected" &&
          decision.detail.startsWith("dependency_cycle_released:"))) failures.push("bundles_native_partial_hold_cycle_was_created");
  }
  if (!contention) failures.push("bundles_real_competing_wood_stone_projects_missing");
  const orders = context.facts.filter((fact): fact is Extract<AiRuntimeProductionFactV1, { kind: "proposal_order" }> =>
    fact.kind === "proposal_order" && fact.playerNumber === 2);
  if (!orders.some((fact) => fact.order.before.length >= 2 &&
      fact.order.order === (branch === "permuted" ? "reverse" : "forward") &&
      JSON.stringify(fact.order.after) === JSON.stringify(branch === "permuted" ? [...fact.order.before].reverse() : fact.order.before) &&
      context.frames.some((frame) => frame.tick === fact.tick && fact.order.after.every((id) =>
        frame.decision.decisions.some((decision) => decision.intent.intentId === id)))))
    failures.push("bundles_actual_proposer_enumeration_control_missing");
  const placements = nativeCompletedPlacements(context);
  if (contenders.size < 2 || [...contenders].some((name) =>
      !placements.some((entry) => entry.value.site.canonicalObjectName === name)))
    failures.push("bundles_newly_feasible_useful_projects_did_not_complete");
  for (const placement of placements) {
    const charge = placement.charge;
    if (charge.kind !== "construction_authority" || charge.construction.kind !== "resource" ||
        !sameVector(charge.construction.configuredCost, charge.construction.requested))
      failures.push("bundles_native_payment_did_not_consume_a_complete_price");
  }
  const field = placements.find((entry) => entry.value.site.canonicalObjectName === ObjectNames.Field);
  if (!field || !hasNativeSourceDelivery(context.capture?.facts ?? [], { sourceActorId: field.siteId, sourceOwner: 2,
    playerNumber: 2, resourceType: ResourceType.Food, fromTick: field.completionTick, throughTick: 3000 }))
    failures.push("bundles_completed_food_prerequisite_never_delivered_income");
  const foreign = context.opponent?.snapshots ?? [], original = foreign[0]?.resources;
  if (foreign.length < 2 || !original || foreign.some((snapshot) => !sameVector(original, snapshot.resources)))
    failures.push("bundles_foreign_resource_bank_changed_or_was_not_observed");
  if (branch === "paid_neighbor") {
    const paid = context.result.productionPreset?.constructionApplications?.find((entry) => entry.fixtureActorId === "paid-neighbor-site");
    if (!paid || !paid.outcomes.some((outcome) => outcome.kind === "applied" && outcome.worldLinkIds.includes(paid.siteActorId)) ||
        !resources.some((type) => paid.resourcesBefore[type] > paid.resourcesAfter[type]) ||
        !context.capture?.frontiers?.intervals.at(-1)?.actors.some(({ identity }) =>
          identity.actorId === paid.siteActorId && identity.alive && identity.finished) ||
        context.facts.some((fact) => fact.kind === "construction_authority" && fact.construction.site.actorId === paid.siteActorId &&
          fact.construction.kind === "resource" && fact.construction.operation === "cancel_refund"))
      failures.push("bundles_original_paid_neighbor_was_not_preserved");
  }
  return [...new Set(failures)];
}
