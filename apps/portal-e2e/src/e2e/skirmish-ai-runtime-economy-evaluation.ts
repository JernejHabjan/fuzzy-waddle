import type { RuntimeEconomyContract } from "./skirmish-ai-runtime-economy-contract";
import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";
import { runtimeResourceCreditMatches } from "./skirmish-ai-runtime-resource-service-validation";

/** Uses exact consumed ledgers and actual scoped receipts; a rising balance or a gather command is insufficient. */
export function evaluateRuntimeEconomy(
  contract: RuntimeEconomyContract | undefined,
  variant: Pick<RuntimeVariantResultV1, "productionCapture" | "presetInitialOrderCount" | "presetResourceGrantCount">
): string[] {
  if (!contract) return [];
  const capture = variant.productionCapture;
  if (
    !capture ||
    capture.droppedFactCount ||
    capture.droppedSnapshotCount ||
    capture.startedTick !== 0 ||
    !capture.snapshots.some((snapshot) => snapshot.tick >= contract.latestTick)
  ) {
    return ["economy_native_history_missing"];
  }
  const failures: string[] = [];
  const facts = capture.facts.filter((fact) => fact.tick <= contract.latestTick);
  const receipts = facts.flatMap((fact) => {
    if (
      fact.kind !== "spatial_authority" ||
      fact.spatial.kind !== "resource_service" ||
      fact.spatial.phase !== "resource_credit"
    )
      return [];
    const value = fact.spatial;
    return value.beneficiary === capture.playerNumber &&
      value.resourceType === contract.resourceType &&
      value.sourceInCaptureScene &&
      value.targetInCaptureScene &&
      !value.snapshotRestoreInProgress &&
      value.sceneActive &&
      runtimeResourceCreditMatches(value)
      ? [{ fact, amount: value.amount, actorId: value.source.actorId }]
      : [];
  });
  if (receipts.reduce((sum, receipt) => sum + receipt.amount, 0) < contract.minimumDelivered)
    failures.push("economy_useful_delivery_missing");
  // The exact committed input remains available even where M11's stronger alias/lifetime journal is partial.
  const reads = facts.flatMap((fact) =>
    fact.kind === "decision_selected" &&
    fact.decision.input?.resources &&
    fact.decision.input.observation?.tick === fact.tick &&
    !fact.decision.input.snapshotRestoreInProgress &&
    !fact.decision.input.gaps.length
      ? [
          {
            sequence: fact.sequence,
            tick: fact.tick,
            generation: fact.decision.input.observation.generation,
            resources: fact.decision.input.resources
          }
        ]
      : []
  );
  if (!reads.length) failures.push("economy_consumed_ledger_missing");
  if (contract.requireZeroIncomeBeforeReceipt) {
    const before = reads.filter((read) => read.sequence < (receipts[0]?.fact.sequence ?? Infinity));
    if (
      !before.length ||
      before.some((read) => {
        const income = read.resources.find(
          (entry) => entry.resourceType === contract.resourceType
        )?.deliveredIncomePerMinute;
        return income?.status !== "known" || income.value !== 0;
      })
    )
      failures.push("economy_grant_inflated_delivered_income");
  }
  let selections = 0,
    contention = false,
    transfer = false,
    fundedSelection = false;
  const transferredWorkerIds = new Set<string>();
  for (const fact of facts) {
    if (fact.kind !== "decision_selected") continue;
    const input = fact.decision.input?.observation;
    const read = reads.find(
      (read) => read.generation === input?.generation && read.tick === input?.tick && read.sequence === fact.sequence
    );
    if (!read) {
      failures.push("economy_selection_ledger_unavailable");
      continue;
    }
    selections++;
    for (const ledger of read.resources) {
      const claims = fact.decision.acceptedIntents
        .flatMap((intent) => intent.claims)
        .filter((claim) => claim.kind === "resource" && claim.resourceType === ledger.resourceType)
        .reduce((sum, claim) => sum + (claim.kind === "resource" ? claim.amount : 0), 0);
      if (claims > Math.max(0, ledger.stockpile - ledger.reservedUnspent - ledger.obligationsDue)) {
        failures.push("economy_aggregate_cash_overpromised");
      }
      fundedSelection ||= claims > 0;
      const pressures = fact.decision.economyProduction.demands.flatMap((demand) => {
        const missing = Math.max(
          0,
          demand.desired -
            demand.satisfiedActorIds.length -
            demand.queuedIds.length -
            demand.constructingIds.length -
            demand.acceptedNotObservedEffectIds.length
        );
        const amount = missing * (demand.resourceObligations[ledger.resourceType] ?? 0);
        return amount > 0 ? [amount] : [];
      });
      // Proposal owners may suppress an unaffordable purchase before arbitration; rejection is not the required outcome.
      contention ||=
        pressures.length > 1 &&
        pressures.reduce((sum, amount) => sum + amount, 0) >
          Math.max(0, ledger.stockpile - ledger.reservedUnspent - ledger.obligationsDue);
    }
    contention ||= fact.decision.decisions.some(
      (decision) => decision.outcome !== "accepted" && decision.reason.includes("resource")
    );
    transfer ||= fact.decision.acceptedIntents.some(
      (intent) =>
        intent.kind === "assign_gatherers" &&
        intent.resourceType === contract.resourceType &&
        intent.reasonCode.startsWith("economy:surplus_transfer")
    );
    for (const intent of fact.decision.acceptedIntents) {
      if (
        intent.kind === "assign_gatherers" &&
        intent.resourceType === contract.resourceType &&
        intent.reasonCode.startsWith("economy:surplus_transfer")
      )
        intent.actorIds.forEach((id) => transferredWorkerIds.add(id));
    }
  }
  if (!selections) failures.push("economy_decisions_missing");
  if (contract.branch === "aggregate_budget" && (!contention || !fundedSelection))
    failures.push("economy_budget_contention_not_exercised");
  if (
    contract.branch === "surplus_transfer" &&
    (!variant.presetInitialOrderCount ||
      !transfer ||
      !receipts.some((receipt) => receipt.actorId !== null && transferredWorkerIds.has(receipt.actorId)))
  )
    failures.push("economy_surplus_worker_transfer_missing");
  if (contract.branch === "poor_delivery") {
    if (!variant.presetResourceGrantCount) failures.push("economy_grant_control_missing");
    const assigned = facts.some(
      (fact) =>
        fact.kind === "decision_selected" &&
        fact.decision.acceptedIntents.some(
          (intent) => intent.kind === "assign_gatherers" && intent.resourceType === contract.resourceType
        )
    );
    if (!assigned) failures.push("economy_poor_delivery_job_not_restored");
  }
  return [...new Set(failures)];
}
