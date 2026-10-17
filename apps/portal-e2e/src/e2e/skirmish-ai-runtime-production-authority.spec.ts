import { expect, test } from "@playwright/test";
import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { productionAuthorityFixture } from "./skirmish-ai-runtime-production-authority-fixture";
import {
  normalizeRuntimeProductionSetup,
  compareRuntimeProductionSetups
} from "./skirmish-ai-runtime-production-setup";
import { evaluateRuntimeProductionAuthority } from "./skirmish-ai-runtime-production-authority-evaluation";
import { productionContract } from "./skirmish-ai-runtime-production-contract-fixtures";
import { projectRuntimeProductionEvidenceV2 } from "./skirmish-ai-runtime-production-evidence-projection";
import { normalizeRuntimeProductionCausality } from "./skirmish-ai-runtime-production-causality-normalization";
import { projectRuntimeProductionLifecycleV2 } from "./skirmish-ai-runtime-production-lifecycle-projection";
import type { RuntimeProductionCausalityV1 } from "./skirmish-ai-runtime-production-causality";

test("paused finished initialization is separate from runtime restore, work and cash claims", () => {
  const { raw, setup } = productionAuthorityFixture();
  const capture = { ...raw.capture, setup };
  const causal = normalizeRuntimeProductionCausality(capture);
  const initialization: RuntimeProductionCausalityV1["constructionLineage"][number] = {
    boundary: {
      sequence: 0,
      tick: 0,
      playerNumber: 1,
      kind: "construction_authority",
      construction: {
        kind: "lifecycle",
        state: 3,
        transition: "restored",
        remainingWorkMs: 0,
        snapshotRestoreInProgress: false,
        sceneActive: false,
        clockTick: 0,
        site: {
          actorId: "temporary-constructor-id",
          objectName: "AnkGuard",
          canonicalObjectName: ObjectNames.AnkGuard,
          playerNumber: 1,
          active: true,
          alive: true,
          finished: true,
          indexed: false
        }
      }
    },
    origin: "restore",
    placement: null,
    initialSite: null,
    commandScope: null,
    application: null,
    gaps: ["production_construction_restore_lineage_missing"]
  };
  const project = (entry: typeof initialization) =>
    projectRuntimeProductionLifecycleV2(capture, { ...causal, constructionLineage: [entry] });
  expect(project(initialization).setupConstruction).toEqual([initialization]);
  expect(project(initialization).construction).toEqual([]);
  expect(project(initialization).gaps).not.toContain("production_construction_restore_lineage_missing");
  for (const changed of [
    { ...initialization, boundary: { ...initialization.boundary, tick: 10 } },
    {
      ...initialization,
      boundary: {
        ...initialization.boundary,
        construction: { ...initialization.boundary.construction, snapshotRestoreInProgress: true }
      }
    },
    {
      ...initialization,
      boundary: {
        ...initialization.boundary,
        construction: { ...initialization.boundary.construction, remainingWorkMs: 100 }
      }
    },
    {
      ...initialization,
      boundary: {
        ...initialization.boundary,
        construction: { ...initialization.boundary.construction, sceneActive: true }
      }
    }
  ])
    expect(project(changed).gaps).toContain("production_construction_restore_lineage_missing");
});

test("raw selected identity survives an unavailable fair graph without manufacturing a route", () => {
  const { raw } = productionAuthorityFixture();
  const selected = {
    ...raw.selected,
    decision: { ...raw.selected.decision, input: { ...raw.input, accessGraph: null } }
  };
  const capture = { ...raw.capture, facts: [selected] };
  const causal = normalizeRuntimeProductionCausality(capture);
  const evidence = projectRuntimeProductionEvidenceV2(capture, causal);
  expect(evidence.decisions).toHaveLength(1);
  expect(evidence.decisions[0]?.result).toEqual(selected.decision);
  expect(evidence.routes.outputs).toEqual([]);
  expect(evidence.movements).toEqual([]);
});

test("actual setup comparison permits only the declared physical position and rejects ambiguity and other state changes", () => {
  const { setup } = productionAuthorityFixture();
  const left = normalizeRuntimeProductionSetup(setup, { threat: "enemy" });
  const moved = { ...setup, actors: setup.actors.map((actor) => ({ ...actor, position: { x: 8, y: 5, z: 0 } })) };
  const right = normalizeRuntimeProductionSetup(moved, { threat: "enemy" });
  expect(compareRuntimeProductionSetups(left, right, "threat")).toEqual([]);
  expect(compareRuntimeProductionSetups(left, right)).toContain("production_pair_actual_world_mismatch");
  expect(compareRuntimeProductionSetups(left, left, "threat")).toContain("production_pair_causal_change_missing");
  const seed = normalizeRuntimeProductionSetup({ ...moved, seed: ["760"] }, { threat: "enemy" });
  expect(compareRuntimeProductionSetups(left, seed, "threat")).toContain("production_pair_actual_world_mismatch");
  const duplicate = normalizeRuntimeProductionSetup(
    { ...setup, actors: [...setup.actors, ...setup.actors.map((actor) => ({ ...actor, actorId: "other" }))] },
    {}
  );
  expect(duplicate.digest).toBeNull();
  expect(duplicate.failures).toContain("production_setup_role_ambiguous");
});

test("V2 refuses unclosed history, wrongly aliased input clocks and explicit missing authority", () => {
  const { evidence } = productionAuthorityFixture();
  const contract = productionContract("PRO-03", "future_committed");
  expect(
    evaluateRuntimeProductionAuthority("PRO-03", contract, {
      ...evidence,
      coverage: { ...evidence.coverage, closedThroughTick: 599 }
    })
  ).toContain("production_v2_closed_history_invalid");
  expect(
    evaluateRuntimeProductionAuthority("PRO-03", contract, {
      ...evidence,
      decisions: evidence.decisions.map((entry) => ({ ...entry, inputTick: entry.selectedTick + 1 }))
    })
  ).toContain("production_v2_decision_clocks_invalid");
  expect(
    evaluateRuntimeProductionAuthority("PRO-03", contract, { ...evidence, gaps: ["missing_real_route"] })
  ).toContain("production_v2_gap:missing_real_route");
  expect(evaluateRuntimeProductionAuthority("PRO-03", contract, undefined)).toEqual(["production_v2_evidence_missing"]);
});

test("a diagnostic capture cannot be silently promoted into complete V2 evidence", () => {
  const { raw } = productionAuthorityFixture();
  const causal = normalizeRuntimeProductionCausality(raw.capture);
  const projected = projectRuntimeProductionEvidenceV2(raw.capture, causal);
  expect(projected.setup).toBeNull();
  expect(projected.coverage).toBeNull();
  expect(projected.gaps).toContain("production_v2_setup_missing");
  expect(projected.decisions[0]?.inputTick).toBe(raw.selected.decision.identity.tick);
  expect(projected.decisions[0]?.selectedTick).toBe(raw.selected.tick);
});
