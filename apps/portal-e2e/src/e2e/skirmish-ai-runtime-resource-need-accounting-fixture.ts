import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import type { RuntimeResourceNeedV1 } from "./skirmish-ai-runtime-resource-need";
import type { RuntimeResourceCreditV1 } from "./skirmish-ai-runtime-resource-credit";
import { recipientJournalFixture } from "./skirmish-ai-runtime-recipient-journal-fixture";
import { resourceServiceFixture } from "./skirmish-ai-runtime-resource-service-fixture";
import { normalizeRuntimeResourceCredits } from "./skirmish-ai-runtime-resource-credit-normalization";

/** Synthetic observed-history calculation control. It cannot upgrade real native alias/liability/lifetime authority. */
export function resourceNeedAccountingFixture() {
  const f = recipientJournalFixture(), service = resourceServiceFixture();
  const original = service.capture.facts.find((fact) => fact.kind === "decision_selected" && fact.decision.gatheringSelections?.length);
  const previous = normalizeRuntimeResourceCredits(service.capture).credits[0];
  if (!original || original.kind !== "decision_selected" || !previous || previous.fact.spatial.kind !== "resource_service" ||
    previous.fact.spatial.phase !== "resource_credit" || previous.contributions.length !== 1) {
    throw new Error("need_accounting_fixture_lineage_missing");
  }
  const selection = { ...service.selection, tick: 0, observationGeneration: 7, catalogGeneration: 7,
    resourceInputRead: f.read, ledger: f.resources.find((entry) => entry.resourceType === service.selection.resourceType) ?? null,
    forecast: { ...service.selection.forecast, amount: 10 }, plannerDeficit: 10 };
  const selected = { ...original, tick: 0, sequence: 3, boundaryState: {
    resources: f.zero, brain: null, pendingCommands: [], pendingResourceClaims: f.zero, obligations: f.zero, queues: [],
    unspentClaims: { resources: f.zero, entries: [], gaps: [] }, snapshotRestoreInProgress: false, gaps: []
  }, decision: { ...original.decision, identity: { ...original.decision.identity, tick: 0, generation: 7 },
    gatheringSelections: [selection], economyProduction: { ...original.decision.economyProduction,
      forecasts: [{ resourceType: selection.resourceType, ...selection.forecast }] } }
  } satisfies AiRuntimeProductionFactV1;
  const mutations: AiRuntimeProductionFactV1[] = [];
  for (const [index, action] of (["add", "pay", "add"] as const).entries()) {
    const before = action === "pay" ? f.after : f.zero, after = action === "pay" ? f.zero : f.after;
    const entrySequence = 4 + index * 2;
    const mutation = { operationId: index + 1, action, entrySequence, requested: { wood: 7 }, before,
      bindingValid: true, lossEpoch: 0 };
    mutations.push({ sequence: entrySequence, tick: 0, playerNumber: 1, kind: "recipient_resource_mutation",
      mutation: { ...mutation, phase: "before", after: null } },
    { sequence: entrySequence + 1, tick: 0, playerNumber: 1, kind: "recipient_resource_mutation",
      mutation: { ...mutation, phase: "returned", after } });
  }
  const credit = { ...previous, appliedAmount: 7, fact: { ...previous.fact, sequence: 10, tick: 0,
    spatial: { ...previous.fact.spatial, operationId: 3, amount: 7, before: f.zero, after: f.after, callbackAmounts: { wood: 7 } } },
    contributions: previous.contributions.map((lot) => {
      const command = lot.gathering.serviceCommand;
      if (!command?.selectedDecision) throw new Error("need_accounting_fixture_command_missing");
      return { ...lot, amount: 7, gathering: { ...lot.gathering, serviceCommand: { ...command,
        selectedDecision: { ...command.selectedDecision, fact: selected } } } };
    })
  } satisfies RuntimeResourceCreditV1;
  const facts = [...f.capture.facts.slice(0, 2), selected, ...mutations, credit.fact];
  const capture = { ...f.capture, facts, recipientResourceFacts: [...f.capture.facts.slice(0, 2), ...mutations],
    resourceCoverage: { ...f.capture.resourceCoverage, frontier: { tick: 0, captureSequence: 10 } } };
  const need = { selectedSequence: 3, selection, grossUnmet: 10, gaps: [] } satisfies RuntimeResourceNeedV1;
  return { capture, need, credit };
}
