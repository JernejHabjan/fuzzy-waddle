import { expect, test } from "@playwright/test";
import { nativeScenarioContext, nativeScenarioRequiresResourceCoverage } from "./skirmish-ai-native-scenario-context";
import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";

test("a missing original role cannot broaden a target-specific native query", () => {
  // Deliberately incomplete capture: this checks rejection only and supplies no native acceptance evidence.
  const result = { presetCreatedActorIds: { original: "native-original" } } as unknown as RuntimeVariantResultV1;
  const context = nativeScenarioContext(result, 100);
  expect(context.failures.length).toBeGreaterThan(0);
  expect(context.role("original")).toBe("native-original");
  expect(() => context.role("replacement")).toThrow("native_required_actor_role_missing:replacement");
});

test("placement evidence can rely on its complete transaction facts without unrelated resource coverage", () => {
  const capture = { facts: [], resourceCoverage: { lost: true } };
  const result = {
    presetCreatedActorIds: {},
    productionCapture: capture,
    opponentCapture: capture
  } as unknown as RuntimeVariantResultV1;

  expect(nativeScenarioContext(result, 100).failures).toContain("native_capture_channel_lost");
  expect(nativeScenarioContext(result, 100, undefined, { requireResourceCoverage: false }).failures).not.toContain(
    "native_capture_channel_lost"
  );
});

test("exact native transaction, strategy and combat proof do not require unrelated broad resource coverage", () => {
  expect(nativeScenarioRequiresResourceCoverage("DOMAIN-01")).toBe(false);
  expect(nativeScenarioRequiresResourceCoverage("DOMAIN-05")).toBe(false);
  for (const id of ["FIGHT-01", "FIGHT-02", "FIGHT-03", "FIGHT-04", "FIGHT-05"])
    expect(nativeScenarioRequiresResourceCoverage(id)).toBe(false);
  expect(nativeScenarioRequiresResourceCoverage("STRAT-02")).toBe(false);
  expect(nativeScenarioRequiresResourceCoverage("STRAT-03")).toBe(false);
  expect(nativeScenarioRequiresResourceCoverage("STRAT-04")).toBe(false);
  expect(nativeScenarioRequiresResourceCoverage("STRAT-05")).toBe(false);
  expect(nativeScenarioRequiresResourceCoverage("H-11")).toBe(false);
  for (const id of ["RAID-01", "RAID-02", "RAID-03"]) expect(nativeScenarioRequiresResourceCoverage(id)).toBe(false);
});

test("STRAT-09 comeback proof uses exact native attack effects instead of broad resource coverage", () => {
  expect(nativeScenarioRequiresResourceCoverage("STRAT-09")).toBe(false);
});

test("H-10 backlog recovery uses exact income events instead of the invalidated broad resource ledger", () => {
  expect(nativeScenarioRequiresResourceCoverage("H-10")).toBe(false);
});

test("H-12 atomic bundles use exact cost, payment, delivery and foreign-bank evidence", () => {
  expect(nativeScenarioRequiresResourceCoverage("H-12")).toBe(false);
});

test("H-13 optional-budget evidence uses exact waiting exposure and paid physical outcomes", () => {
  expect(nativeScenarioRequiresResourceCoverage("H-13")).toBe(false);
});

test("H-14 lane-priority evidence uses exact native consideration, service and outcome events", () => {
  expect(nativeScenarioRequiresResourceCoverage("H-14")).toBe(false);
});

test("H-15 emergency evidence uses exact damage, defense and delayed-receipt events", () => {
  expect(nativeScenarioRequiresResourceCoverage("H-15")).toBe(false);
});

test("H-30 fault isolation uses exact injection, recovery and reconciliation events", () => {
  expect(nativeScenarioRequiresResourceCoverage("H-30")).toBe(false);
});

test("authority fault evidence relies on exact native output transactions instead of broad resource coverage", () => {
  expect(nativeScenarioRequiresResourceCoverage("H-06")).toBe(false);
  expect(nativeScenarioRequiresResourceCoverage("H-07")).toBe(false);
  expect(nativeScenarioRequiresResourceCoverage("H-08")).toBe(true);
});

test("domain evidence does not reject an additional native opponent for broad resource coverage loss", () => {
  const capture = { facts: [], resourceCoverage: { lost: true }, setup: {} };
  const result = {
    presetCreatedActorIds: {},
    productionCapture: capture,
    opponentCapture: capture,
    otherOpponentCaptures: [{ ...capture, playerNumber: 3 }]
  } as unknown as RuntimeVariantResultV1;

  expect(nativeScenarioContext(result, 100, undefined, { requireResourceCoverage: false }).failures).not.toContain(
    "native_other_opponent_capture_invalid"
  );
});
