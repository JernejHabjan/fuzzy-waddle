import { AiRuntimeUnspentClaims } from "./ai-runtime-unspent-claims";
import { unspentClaimFixture } from "./ai-runtime-unspent-claim-fixtures";
import { pendingCommandOutcome } from "./ai-runtime-pending-command-fixtures";

describe("AiRuntimeUnspentClaims synthetic contracts", () => {
  it("retains one selected claim through admission, then retires only the actual completed payment", () => {
    const f = unspentClaimFixture();
    const ledger = new AiRuntimeUnspentClaims();
    ledger.observeDecision(f.decision);
    expect(ledger.snapshot(2).resources?.food).toBe(35);
    ledger.observeDispatch(f.request);
    ledger.observeOutcome(pendingCommandOutcome());
    expect(ledger.snapshot(2).resources?.food).toBe(35);
    ledger.observeResource(2, f.resource);
    expect(ledger.snapshot(2).resources?.food).toBe(35);
    ledger.observeResource(2, { ...f.resource, emission: { ...f.resource.emission, phase: "callback",
      callbackOrdinal: 1, amounts: { food: 35 } } });
    expect(ledger.snapshot(2).resources).toBeNull();
    ledger.observeResource(2, { ...f.resource, emission: { ...f.resource.emission, phase: "finished", status: "returned",
      after: { food: 65, wood: 100, stone: 100, minerals: 100 }, callbackCount: 1,
      callbackLimitExceeded: false, nestedEmission: false, balanceMatches: true } });
    ledger.observeOutcome(pendingCommandOutcome("applied"));
    ledger.observeDispatch(f.receipt);
    const paid = ledger.snapshot(2);
    expect(paid.gaps).toEqual([]);
    expect(paid.resources?.food).toBe(0);
    expect(paid.entries[0].state).toBe("paid");
    ledger.observeResource(2, { ...f.resource, operation: "cancellation_refund" });
    expect(ledger.snapshot(2).resources?.food).toBe(0);
    expect(paid.entries[0].intent).not.toBe(f.intent);
  });

  it("transfers pay-over-time ownership to the actual queue instead of counting claim and future charges twice", () => {
    const f = unspentClaimFixture();
    const ledger = new AiRuntimeUnspentClaims();
    ledger.observeDecision(f.decision); ledger.observeDispatch(f.request); ledger.observeOutcome(pendingCommandOutcome());
    ledger.observeQueue(2, { actorId: "producer", objectName: "producer", lanes: [{ laneId: "producer:lane:0", capacity: 2,
      items: [{ itemId: f.resource.itemId, identitySource: "command", commandId: f.resource.originatingCommandContext.execution.commandId,
        effectId: "one", objectName: f.resource.objectName, researchType: null, payment: "per_successful_tick",
        totalTimeMs: 100, remainingTimeMs: 100, charge: { food: 35 } }] }] });
    ledger.observeOutcome(pendingCommandOutcome("applied"));
    expect(ledger.snapshot(2).resources?.food).toBe(0);
    expect(ledger.snapshot(2).entries[0].state).toBe("queue_liability");
    ledger.observeOutcome(pendingCommandOutcome("cancelled"));
    expect(ledger.snapshot(2).entries[0].state).toBe("released");
  });

  it("keeps forecasts separate, releases an unadmitted omitted lease and rejects unknown existing ownership", () => {
    const f = unspentClaimFixture();
    const ledger = new AiRuntimeUnspentClaims();
    ledger.observeDecision({ ...f.decision, acceptedIntents: [], decisions: [], reservations: f.decision.reservations.map((lease) =>
      ({ ...lease, state: { kind: "forecast" } })) });
    expect(ledger.snapshot(2).resources?.food).toBe(0);
    ledger.observeDecision(f.decision);
    ledger.observeDecision({ ...f.decision, acceptedIntents: [], decisions: [], reservations: [] });
    expect(ledger.snapshot(2).resources?.food).toBe(0);
    const unknown = new AiRuntimeUnspentClaims();
    unknown.observeDecision({ ...f.decision, acceptedIntents: [], decisions: [] });
    expect(unknown.snapshot(2).resources).toBeNull();
    expect(unknown.snapshot(2).gaps).toContain("unspent_pre_capture_lease_authority_missing");
  });

  it("rejected admission releases a lease, while invalid payment, migrated subjects and overflow stay unknown", () => {
    const f = unspentClaimFixture();
    const rejected = new AiRuntimeUnspentClaims();
    rejected.observeDecision(f.decision); rejected.observeDispatch(f.request);
    rejected.observeDispatch({ kind: "finished", playerNumber: 2, correlation: f.request.correlation,
      receipt: { status: "rejected", reason: "application_failed" } });
    expect(rejected.snapshot(2).resources?.food).toBe(0);
    for (const mutation of ["payment", "migrated", "overflow"] as const) {
      const ledger = new AiRuntimeUnspentClaims();
      const reservations = mutation === "migrated" ? f.decision.reservations.map((lease) => ({ ...lease, subjectKey: undefined })) :
        mutation === "overflow" ? Array.from({ length: 513 }, () => f.decision.reservations[0]) : f.decision.reservations;
      ledger.observeDecision({ ...f.decision, reservations });
      if (mutation === "payment") {
        ledger.observeDispatch(f.request); ledger.observeOutcome(pendingCommandOutcome());
        ledger.observeResource(2, f.resource);
        ledger.observeResource(2, { ...f.resource, emission: { ...f.resource.emission, phase: "finished", status: "returned",
          after: { food: 65, wood: 100, stone: 100, minerals: 100 }, callbackCount: 1,
          callbackLimitExceeded: false, nestedEmission: false, balanceMatches: true } });
      }
      expect(ledger.snapshot(2).resources).toBeNull();
    }
  });

  it("never replaces missing selection, invalid money, wrong epoch or applied-without-payment by zero", () => {
    for (const mutation of ["missing", "amount", "epoch", "application", "duplicate", "lost"] as const) {
      const f = unspentClaimFixture(); const ledger = new AiRuntimeUnspentClaims();
      if (mutation !== "missing") ledger.observeDecision(f.decision);
      ledger.observeDispatch(mutation === "amount" ? { ...f.request, claims: [] } : f.request);
      ledger.observeOutcome({ ...pendingCommandOutcome(), authorityEpoch: mutation === "epoch" ? 2 : 1 });
      if (mutation === "application") ledger.observeOutcome(pendingCommandOutcome("applied"));
      if (mutation === "duplicate") ledger.observeDecision(f.decision);
      if (mutation === "lost") ledger.observeOutcome({ ...pendingCommandOutcome("failed"), reason: "lost_outcome" });
      expect(ledger.snapshot(2).resources).toBeNull();
    }
    const ledger = new AiRuntimeUnspentClaims();
    ledger.dispose();
    expect(ledger.snapshot(2).resources).toBeNull();
  });
});
