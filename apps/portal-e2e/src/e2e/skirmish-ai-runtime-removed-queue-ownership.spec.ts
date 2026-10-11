import { expect, test } from "@playwright/test";
import { productionPerTickCancellationFixture } from "./skirmish-ai-runtime-per-tick-cancellation-fixture";
import { productionQueueMutationFixture } from "./skirmish-ai-runtime-production-queue-mutation-fixture";
import { normalizeRuntimeProductionCausality } from "./skirmish-ai-runtime-production-causality-normalization";
import { reconcileRuntimeProductionUnspent } from "./skirmish-ai-runtime-production-unspent";

/** Queue-claim subset only: exact removed physical state is separate from useful effect and global/restore authority. */
test.describe("removed per-tick ownership synthetic contracts", () => {
  for (const operation of ["cancel_remove", "complete_remove"] as const) {
    test(`${operation} retires only with the captured prefix interval and preserves unrelated liabilities`, () => {
      const source = operation === "cancel_remove" ? productionPerTickCancellationFixture()
        : productionQueueMutationFixture("completion");
      const result = normalizeRuntimeProductionCausality(source);
      const sample = source.facts.find((entry) => entry.kind === "queue_mutation" &&
        entry.mutation.operation === operation && entry.mutation.phase === "after");
      if (!sample?.boundaryState) throw new Error("synthetic_removed_boundary_missing");
      const exact = reconcileRuntimeProductionUnspent(source, sample, result.commands, result.payments);
      expect(exact.failures).toEqual([]);
      expect(exact.resources?.food).toBe(0);
      expect(sample.boundaryState.obligations?.food).toBe(11);
      for (const missing of ["before", "all", "restore"] as const) {
        const facts = source.facts.filter((entry) => entry.kind !== "queue_mutation" ||
          entry.mutation.operation !== operation || (missing !== "all" && entry.mutation.phase !== "before"));
        const observed = missing === "restore" ? { ...sample, boundaryState: {
          ...sample.boundaryState, snapshotRestoreInProgress: true } } : sample;
        const unresolved = reconcileRuntimeProductionUnspent({ ...source, facts }, observed, result.commands, result.payments);
        expect(unresolved.resources).toBeNull();
        if (missing === "restore") expect(unresolved.failures).toContain("production_ai_operation_unspent_restore_invalid");
        else expect(unresolved.gaps).toContain("production_ai_operation_queue_transfer_missing");
      }
    });
  }
});
