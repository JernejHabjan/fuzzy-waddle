import assert from "node:assert/strict";
import test from "node:test";
import { selectDiagnosticVariant } from "./skirmish-runtime-diagnostic-selection.mjs";

const fixture = {
  recipe: {
    variants: [
      { id: "subject", scenarioIds: ["PRO-05"], repetitions: 3 },
      { id: "control", scenarioIds: ["PRO-06"], repetitions: 2 }
    ]
  }
};

test("selects exactly one authored repetition for a scenario", () => {
  assert.deepEqual(selectDiagnosticVariant({ variant: "subject", repetition: "2" }, "PRO-05", "runtime", fixture), {
    scenarioId: "PRO-05", variantId: "subject", repetition: 2
  });
});

test("uses an authored variant multiplayer override for a focused single-player control", () => {
  const fixture = {
    recipe: {
      requiresMultiplayer: true,
      variants: [
        { id: "sp", scenarioIds: ["H-32"], requiresMultiplayer: false },
        { id: "peer", scenarioIds: ["H-32"], requiresMultiplayer: true }
      ]
    }
  };
  assert.deepEqual(selectDiagnosticVariant({ variant: "sp", repetition: "1" }, "H-32", "runtime", fixture), {
    scenarioId: "H-32", variantId: "sp", repetition: 1, requiresMultiplayer: false
  });
  assert.deepEqual(selectDiagnosticVariant({ variant: "peer", repetition: "1" }, "H-32", "runtime", fixture), {
    scenarioId: "H-32", variantId: "peer", repetition: 1, requiresMultiplayer: true
  });
});

test("rejects irrelevant variants and repetitions beyond the authored count", () => {
  assert.throws(() => selectDiagnosticVariant({ variant: "control", repetition: "1" },
    "PRO-05", "runtime", fixture), /diagnostic_variant_missing_or_ambiguous/);
  assert.throws(() => selectDiagnosticVariant({ variant: "subject", repetition: "4" },
    "PRO-05", "runtime", fixture), /diagnostic_repetition_out_of_range/);
});

test("rejects partial or unsafe diagnostic selections", () => {
  assert.throws(() => selectDiagnosticVariant({ variant: "subject", repetition: "1" },
    "PRO-05", "pure", fixture), /invalid_diagnostic_variant/);
  assert.throws(() => selectDiagnosticVariant({ variant: "subject", repetition: undefined },
    "PRO-05", "runtime", fixture), /repetition/);
  assert.throws(() => selectDiagnosticVariant({ variant: "../subject", repetition: "1" },
    "PRO-05", "runtime", fixture), /invalid_diagnostic_variant/);
});
