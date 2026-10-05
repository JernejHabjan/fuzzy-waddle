import { expect, test } from "@playwright/test";
import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import { normalizeRuntimeProductionCausality } from "./skirmish-ai-runtime-production-causality-normalization";
import { productionRejectionFixture } from "./skirmish-ai-runtime-production-rejection-fixture";
import { productionCompletionFixture } from "./skirmish-ai-runtime-production-completion-fixture";

/** Invented authority contracts; execution and live strategic coverage remain final-gate obligations. */
test.describe("native queue completed-effect authority", () => {
  for (const family of ["production", "research"] as const) {
    test(`${family} joins distinct removal, actual registration and terminal without promoting useful-effect evidence`, () => {
      const result = normalizeRuntimeProductionCausality(productionCompletionFixture(family));
      expect(result.failures).toEqual([]);
      expect(result.completions).toHaveLength(1);
      const completed = result.completions[0];
      expect(completed).toMatchObject({ originatingCommandId: "purchase", itemId: "queue:producer:purchase",
        requestedTick: 4, scheduledTick: 6, removalTick: 10, authorityTick: 10, terminalTick: 10 });
      expect(completed.removalSequence).toBeLessThan(completed.authorityBoundarySequences[0]);
      expect(completed.registeredSequence).toBeGreaterThan(completed.authorityBoundarySequences[0]);
      expect(completed.registeredSequence).toBeLessThan(completed.authorityBoundarySequences[1]);
      expect(completed.terminalSequence).toBeGreaterThan(completed.authorityBoundarySequences[1]);
      expect(result.gaps).not.toContain("production_ai_mutation_created_effect_authority_missing");
      expect(result.gaps).toContain("production_ai_event_liabilities_missing");
      expect(result.gaps).toContain("production_ai_definition_catalog_missing");
      if (family === "production") {
        expect(completed.createdActor).toMatchObject({ objectName: ObjectNames.TivaraWorkerMale,
          canonicalObjectName: ObjectNames.TivaraWorker, indexed: true, playerNumber: 1 });
        expect(result.gaps).not.toContain("production_ai_operation_queue_transfer_missing");
      } else {
        expect(completed.createdActor).toBeNull();
        expect(completed.worldLinkId).toBe(`research:${completed.researchType}`);
        expect(result.operations.filter((operation) => operation.kind === "immediate_charge")).toHaveLength(1);
        expect(result.operations.some((operation) => operation.tick === 10)).toBe(false);
      }
    });
  }

  test("production retains actual async terminal time independently of intended application and creation time", () => {
    const result = normalizeRuntimeProductionCausality(productionCompletionFixture("production", 12));
    expect(result.failures).toEqual([]);
    expect(result.completions[0]).toMatchObject({ requestedTick: 4, scheduledTick: 6, authorityTick: 10, terminalTick: 12 });
  });

  test("a creator returning no actor with its actual failed terminal retains failure-to-create without completion credit", () => {
    const source = productionCompletionFixture();
    const facts = source.facts.flatMap((fact): AiRuntimeProductionFactV1[] => {
      if (fact.kind === "actor_registered") return [];
      if (fact.kind === "queue_completion") return [{ ...fact, completion: {
        ...fact.completion, createdActor: null, createdActorInProducerScene: null } }];
      if (fact.kind === "outcome" && fact.outcome.kind === "completed") return [{ ...fact, outcome: {
        ...fact.outcome, kind: "failed", reason: "application_failed", worldLinkIds: [] } }];
      return [fact];
    });
    const result = normalizeRuntimeProductionCausality({ ...source, facts });
    expect(result.failures).toEqual([]); expect(result.completions).toEqual([]);
    expect(result.gaps).toContain("production_ai_completion_creation_failed");
  });

  for (const stage of ["admission", "application"] as const) {
    test(`a ${stage} rejection cannot coexist with an attributed actual creation callback`, () => {
      const source = productionRejectionFixture(stage);
      const creation = productionCompletionFixture().facts.filter((fact) => fact.kind === "queue_completion");
      const facts = [...source.facts, ...creation].map((fact, index) => ({ ...fact, sequence: index + 1 }));
      const result = normalizeRuntimeProductionCausality({ ...source, facts });
      expect(result.failures).toContain("production_ai_rejection_native_effect");
      expect(result.rejections).toEqual([]); expect(result.completions).toEqual([]);
    });
  }

  test("nested authority intervals cannot consume the same exact native physical removal twice", () => {
    const source = productionCompletionFixture();
    const facts = source.facts.flatMap((fact): AiRuntimeProductionFactV1[] => fact.kind === "queue_completion" ?
      fact.completion.phase === "before" ? [{ ...fact, completion: { ...fact.completion, completionId: 2 } }, fact] :
        [fact, { ...fact, completion: { ...fact.completion, completionId: 2 } }] : [fact]);
    const result = normalizeRuntimeProductionCausality({ ...source,
      facts: facts.map((fact, index) => ({ ...fact, sequence: index + 1 })) });
    expect(result.failures).toContain("production_ai_completion_removal_lineage_invalid");
    expect(result.completions).toEqual([]);
  });

  for (const missing of ["authority", "registration", "terminal", "removal"] as const) {
    test(`missing ${missing} authority remains a named gap without borrowing the native world link`, () => {
      const source = productionCompletionFixture();
      const facts = source.facts.filter((fact) => missing === "authority" ? fact.kind !== "queue_completion" :
        missing === "registration" ? fact.kind !== "actor_registered" : missing === "terminal" ?
          fact.kind !== "outcome" || fact.outcome.kind !== "completed" :
          fact.kind !== "queue_mutation" || fact.mutation.operation !== "complete_remove");
      const result = normalizeRuntimeProductionCausality({ ...source, facts });
      expect(result.failures).toEqual([]);
      expect(result.completions).toEqual([]);
      expect(result.gaps.some((gap) => gap.includes("completion") || gap.includes("completed_effect"))).toBe(true);
    });
  }

  for (const defect of [
    "native", "item", "owner", "product", "requested_family", "index", "inactive", "dead", "unfinished", "scene",
    "world_link", "restore", "threw", "conflicting_terminal", "duplicate_interval", "duplicate_registration",
    "preexisting_actor", "removed_actor"
  ]) {
    test(`contradictory ${defect} completion suppresses every normalized causal effect`, () => {
      const source = productionCompletionFixture();
      let facts = source.facts.map((fact): AiRuntimeProductionFactV1 => {
        if (fact.kind === "queue_completion") {
          const completion = { ...fact.completion };
          if (defect === "native" && completion.originatingCommandContext) completion.originatingCommandContext = {
            ...completion.originatingCommandContext,
            execution: { ...completion.originatingCommandContext.execution, effectId: "foreign" } };
          if (defect === "item" && completion.item) completion.item = { ...completion.item, charge: { food: 9 } };
          if (defect === "requested_family") completion.requestedCanonicalObjectName = ObjectNames.AnkGuard;
          if (defect === "restore") completion.snapshotRestoreInProgress = true;
          if (defect === "threw" && completion.phase === "after") completion.phase = "threw";
          if (completion.createdActor) {
            if (defect === "owner") completion.createdActor = { ...completion.createdActor, playerNumber: 2 };
            if (defect === "product") completion.createdActor = { ...completion.createdActor, canonicalObjectName: ObjectNames.AnkGuard };
            if (defect === "index") completion.createdActor = { ...completion.createdActor, indexed: false };
            if (defect === "inactive") completion.createdActor = { ...completion.createdActor, active: false };
            if (defect === "dead") completion.createdActor = { ...completion.createdActor, alive: false };
            if (defect === "unfinished") completion.createdActor = { ...completion.createdActor, finished: false };
            if (defect === "scene") completion.createdActorInProducerScene = false;
          }
          return { ...fact, completion };
        }
        if (defect === "world_link" && fact.kind === "outcome" && fact.outcome.kind === "completed") {
          return { ...fact, outcome: { ...fact.outcome, worldLinkIds: ["borrowed"] } };
        }
        return fact;
      });
      const terminal = facts.find((fact) => fact.kind === "outcome" && fact.outcome.kind === "completed");
      const registration = facts.find((fact) => fact.kind === "actor_registered");
      if (!terminal || terminal.kind !== "outcome" || !registration || registration.kind !== "actor_registered") {
        throw new Error("synthetic_authority_missing");
      }
      if (defect === "conflicting_terminal") facts.push({ ...terminal, outcome: { ...terminal.outcome, kind: "cancelled" } });
      if (defect === "duplicate_interval") facts = facts.flatMap((fact) => fact.kind === "queue_completion" ? [fact, fact] : [fact]);
      if (defect === "duplicate_registration") facts = facts.flatMap((fact) => fact === registration ? [fact, fact] : [fact]);
      if (defect === "preexisting_actor") facts = [registration, ...facts.filter((fact) => fact !== registration)]
        .map((fact, index) => index === 0 ? { ...fact, tick: 4 } : fact);
      if (defect === "removed_actor") facts = facts.flatMap((fact): AiRuntimeProductionFactV1[] => fact === terminal ? [{
        sequence: 0, tick: 10, playerNumber: 1, kind: "actor_unregistered", actorId: "synthetic-created-actor",
        objectName: ObjectNames.TivaraWorkerMale }, fact] : [fact]);
      const result = normalizeRuntimeProductionCausality({ ...source,
        facts: facts.map((fact, index) => ({ ...fact, sequence: index + 1 })) });
      expect(result.failures.length).toBeGreaterThan(0);
      expect(result.completions).toEqual([]); expect(result.queueMutations).toEqual([]);
      expect(result.operations).toEqual([]); expect(result.payments).toEqual([]); expect(result.rejections).toEqual([]);
    });
  }

  for (const defect of ["pre_registered", "not_registered", "duplicate_registration", "wrong_link", "wrong_type"]) {
    test(`contradictory ${defect} research cannot borrow a global completed-tech notification`, () => {
      const source = productionCompletionFixture("research");
      const facts = source.facts.flatMap((fact): AiRuntimeProductionFactV1[] => {
        if (fact.kind === "queue_completion") return [{ ...fact, completion: { ...fact.completion,
          researchRegistered: defect === "pre_registered" ? true : defect === "not_registered" ? false : fact.completion.researchRegistered } }];
        if (fact.kind === "research_completed" && defect === "duplicate_registration") return [fact, fact];
        if (fact.kind === "queue_mutation" && fact.mutation.item && defect === "wrong_type") return [{ ...fact,
          mutation: { ...fact.mutation, item: { ...fact.mutation.item, objectName: ObjectNames.TivaraWorker } } }];
        if (fact.kind === "outcome" && fact.outcome.kind === "completed" && defect === "wrong_link") return [{ ...fact,
          outcome: { ...fact.outcome, worldLinkIds: ["borrowed-tech"] } }];
        return [fact];
      });
      const result = normalizeRuntimeProductionCausality({ ...source,
        facts: facts.map((fact, index) => ({ ...fact, sequence: index + 1 })) });
      expect(result.failures.length).toBeGreaterThan(0); expect(result.completions).toEqual([]);
    });
  }
});
