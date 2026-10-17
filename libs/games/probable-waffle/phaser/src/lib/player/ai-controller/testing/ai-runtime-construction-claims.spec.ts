import { ConstructionStateEnum, ObjectNames, type ConstructCommand } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiIntentV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import type { AiRuntimeConstructionV1 } from "./ai-runtime-construction-v1";
import { AiRuntimeUnspentClaims } from "./ai-runtime-unspent-claims";
import { unspentClaimFixture } from "./ai-runtime-unspent-claim-fixtures";
import { pendingCommandOutcome } from "./ai-runtime-pending-command-fixtures";

/** Invented construction scopes exercise ownership only; real placement/work/route evidence is a separate native gate. */
function fixture(existingCommandId?: string) {
  const f = unspentClaimFixture();
  const intent = {
    ...f.intent,
    kind: "construct",
    builderIds: ["builder-1", "builder-2"],
    objectName: ObjectNames.AnkGuard,
    logicalPosition: { x: 3, y: 4, z: 0 },
    siteKey: "site:one"
  } satisfies AiIntentV1;
  const command = {
    type: "CONSTRUCT",
    playerNumber: 2,
    actorIds: intent.builderIds,
    actorName: intent.objectName,
    tileVec3: intent.logicalPosition,
    siteKey: intent.siteKey,
    tick: 102,
    execution: f.resource.originatingCommandContext.execution
  } satisfies ConstructCommand;
  const ledger = new AiRuntimeUnspentClaims();
  ledger.observeDecision({
    ...f.decision,
    acceptedIntents: [intent],
    decisions: [{ intent, outcome: "accepted", reason: "accepted" }]
  });
  ledger.observeDispatch({ ...f.request, command, acceptedIntent: intent });
  ledger.observeOutcome(pendingCommandOutcome("dispatched", "one", 102, intent.builderIds));
  ledger.observeOutcome(pendingCommandOutcome("applied", "one", 102, intent.builderIds));
  ledger.observePlacement(
    existingCommandId ? { ...command, execution: { ...command.execution, commandId: existingCommandId } } : command,
    "site-1"
  );
  const charge = {
    kind: "resource",
    operation: "start_charge",
    status: "returned",
    ownerArgument: 2,
    configuredCostType: 0,
    requiredWorkMs: 100,
    configuredCost: { food: 35 },
    requested: { food: 35 },
    refundFactor: null,
    before: { food: 100, wood: 100, stone: 100, minerals: 100 },
    after: { food: 65, wood: 100, stone: 100, minerals: 100 },
    callbackAmounts: { food: 35 },
    callbackCount: 1,
    nestedEmission: false,
    balanceMatches: true,
    state: ConstructionStateEnum.NotStarted,
    remainingWorkMs: 0,
    snapshotRestoreInProgress: false,
    clockTick: 103,
    sceneActive: true,
    site: {
      actorId: "site-1",
      objectName: ObjectNames.AnkGuard,
      canonicalObjectName: ObjectNames.AnkGuard,
      playerNumber: 2,
      active: true,
      alive: true,
      finished: false,
      indexed: true
    }
  } satisfies AiRuntimeConstructionV1;
  return { ledger, charge };
}

it("keeps multi-builder construction cash after placement and retires it only on the exact native payment", () => {
  const { ledger, charge } = fixture();
  expect(ledger.snapshot(2).gaps).toEqual([]);
  expect(ledger.snapshot(2).resources?.food).toBe(35);
  ledger.observeConstruction(2, { ...charge, status: "denied" });
  expect(ledger.snapshot(2).resources?.food).toBe(35);
  ledger.observeConstruction(2, charge);
  expect(ledger.snapshot(2).gaps).toEqual([]);
  expect(ledger.snapshot(2).resources?.food).toBe(0);
  expect(ledger.snapshot(2).entries[0]?.state).toBe("paid");
});

it("releases an unused claim only when native reconciliation names a distinct prior placement at the exact site", () => {
  const { ledger } = fixture("prior-placement");
  const outcome = {
    ...pendingCommandOutcome("completed", "one", 102, ["builder-1", "builder-2"]),
    detail: "site_reconciled",
    worldLinkIds: ["site-1"]
  };
  ledger.observeOutcome(outcome);
  expect(ledger.snapshot(2).resources?.food).toBe(0);
  expect(ledger.snapshot(2).gaps).toEqual([]);
  for (const id of [undefined, "prior-placement"]) {
    const invalid = fixture(id);
    invalid.ledger.observeOutcome({ ...outcome, worldLinkIds: id ? ["unknown-site"] : ["site-1"] });
    expect(invalid.ledger.snapshot(2).resources).toBeNull();
    expect(invalid.ledger.snapshot(2).gaps).toContain("unspent_construction_reconciled_site_missing");
  }
});

it.each(["wrong_owner", "wrong_site", "duplicate", "nested", "wrong_cost", "per_tick"] as const)(
  "refuses to certify invalid construction payment: %s",
  (defect) => {
    const { ledger, charge } = fixture();
    if (defect === "duplicate") ledger.observeConstruction(2, charge);
    ledger.observeConstruction(2, {
      ...charge,
      ...(defect === "wrong_owner" ? { ownerArgument: 3 } : {}),
      ...(defect === "wrong_site" ? { site: { ...charge.site, canonicalObjectName: ObjectNames.WorkMill } } : {}),
      ...(defect === "nested" ? { nestedEmission: true } : {}),
      ...(defect === "wrong_cost" ? { configuredCost: { food: 36 } } : {}),
      ...(defect === "per_tick" ? { configuredCostType: 1 } : {})
    });
    expect(ledger.snapshot(2).resources).toBeNull();
    expect(ledger.snapshot(2).gaps).toContain("unspent_construction_payment_authority_invalid");
  }
);
