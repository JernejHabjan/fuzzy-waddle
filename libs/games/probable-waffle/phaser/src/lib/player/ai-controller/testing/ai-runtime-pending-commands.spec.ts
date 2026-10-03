import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { AiRuntimePendingCommands } from "./ai-runtime-pending-commands";
import { pendingCommandRequest, pendingCommandOutcome, pendingCommandFinished } from "./ai-runtime-pending-command-fixtures";

function admitted() {
  const ledger = new AiRuntimePendingCommands();
  ledger.observeDispatch(pendingCommandRequest(), 100);
  ledger.observeOutcome(pendingCommandOutcome(), 100);
  ledger.observeDispatch(pendingCommandFinished(), 100);
  return ledger;
}

describe("AiRuntimePendingCommands", () => {
  it("owns real admitted claims between actual request and scheduled application, keeping detached product and identity", () => {
    const ledger = admitted();
    const snapshot = ledger.snapshot(2);
    expect(snapshot.commands[0]).toMatchObject({ requestedTick: 100, scheduledTick: 102, proposedTick: 99,
      commandId: "2:1:1:match:one", unresolvedActorIds: ["producer"] });
    expect(snapshot.resources?.food).toBe(35);
    expect(snapshot.gaps).toEqual([]);
    expect(ledger.snapshot(1).commands).toEqual([]);
    ledger.observeOutcome(pendingCommandOutcome("applied"), 102);
    expect(ledger.snapshot(2).resources?.food).toBe(0);
    expect(snapshot.resources?.food).toBe(35);
    expect(snapshot.commands).toHaveLength(1);
  });

  it("never recreates a spent synchronous claim when the dispatch receipt arrives after application", () => {
    const ledger = new AiRuntimePendingCommands();
    ledger.observeDispatch(pendingCommandRequest(), 100);
    ledger.observeOutcome(pendingCommandOutcome("dispatched", "one", 100), 100);
    ledger.observeOutcome(pendingCommandOutcome("applied", "one", 100), 100);
    ledger.observeDispatch(pendingCommandFinished("one", 100), 100);
    expect(ledger.snapshot(2)).toMatchObject({ commands: [], resources: { food: 0 }, gaps: [] });
  });

  it("observes a buffered cancellation with zero cash credit until real application, and never infers money from its receipt", () => {
    const ledger = new AiRuntimePendingCommands();
    const request = pendingCommandRequest();
    ledger.observeDispatch({ ...request, claims: [],
      command: { type: "CANCEL_PRODUCTION", playerNumber: 2, actorIds: ["producer"], queueIndex: 0 } }, 100);
    ledger.observeOutcome(pendingCommandOutcome(), 100);
    expect(ledger.snapshot(2).commands[0].command.type).toBe("CANCEL_PRODUCTION");
    expect(ledger.snapshot(2).resources?.food).toBe(0);
    ledger.observeOutcome(pendingCommandOutcome("cancelled"), 100);
    expect(ledger.snapshot(2).commands).toHaveLength(1);
    ledger.observeOutcome(pendingCommandOutcome("cancelled"), 102);
    expect(ledger.snapshot(2).commands).toEqual([]);
    expect(ledger.snapshot(2).resources?.food).toBe(0);
  });

  it("retains the whole claim across partial actors, ignoring duplicate, wrong-player and premature callbacks", () => {
    const ledger = new AiRuntimePendingCommands();
    ledger.observeDispatch(pendingCommandRequest("one", ["a", "b"]), 100);
    ledger.observeOutcome(pendingCommandOutcome("dispatched", "one", 102, ["a", "b"]), 100);
    ledger.observeOutcome({ ...pendingCommandOutcome("rejected", "one", 100, ["a", "b"]),
      reason: "duplicate_command" }, 100);
    ledger.observeOutcome({ ...pendingCommandOutcome("applied", "one", 102, ["a", "b"]), playerNumber: 1 }, 102);
    ledger.observeOutcome(pendingCommandOutcome("applied", "one", 101, ["a"]), 101);
    expect(ledger.snapshot(2).resources?.food).toBe(35);
    ledger.observeOutcome(pendingCommandOutcome("applied", "one", 102, ["a"]), 102);
    expect(ledger.snapshot(2).commands[0].unresolvedActorIds).toEqual(["b"]);
    expect(ledger.snapshot(2).resources?.food).toBe(35);
    ledger.observeOutcome(pendingCommandOutcome("rejected", "one", 102, ["b"]), 102);
    expect(ledger.snapshot(2).commands).toEqual([]);
    expect(ledger.snapshot(2).gaps).toEqual([
      "pending_dispatch_early_application", "pending_dispatch_outcome_mismatch"
    ]);
  });

  it("rejects unknown admission and malformed claims rather than guessing prices or hiding missing capture", () => {
    const ledger = new AiRuntimePendingCommands();
    ledger.observeOutcome(pendingCommandOutcome(), 100);
    expect(ledger.snapshot(2).gaps).toContain("pending_dispatch_unobserved_intent");
    for (const amount of [-1, NaN, Infinity]) {
      const request = pendingCommandRequest(String(amount));
      ledger.observeDispatch({ ...request, claims: [{ kind: "resource", claimId: "claim:bad",
        resourceType: ResourceType.Food, amount }] }, 100);
      ledger.observeOutcome(pendingCommandOutcome("dispatched", String(amount)), 100);
      ledger.observeDispatch({ kind: "finished", playerNumber: 2, correlation: request.correlation,
        receipt: { status: "rejected", reason: "application_failed" } }, 100);
    }
    expect(ledger.snapshot(2).commands).toEqual([]);
    expect(ledger.snapshot(2).resources?.food).toBe(0);
    expect(ledger.snapshot(2).gaps).toContain("pending_dispatch_invalid_admission");
  });

  it("keeps unresolved ownership for lost outcomes or exceptions and flags an inconsistent post-admission receipt", () => {
    const ledger = admitted();
    ledger.observeOutcome({ ...pendingCommandOutcome("failed"), reason: "lost_outcome" }, 102);
    expect(ledger.snapshot(2).resources?.food).toBe(35);
    const second = pendingCommandRequest("two");
    ledger.observeDispatch(second, 100);
    ledger.observeOutcome(pendingCommandOutcome("dispatched", "two"), 100);
    ledger.observeDispatch({ kind: "threw", playerNumber: 2, correlation: second.correlation }, 100);
    const third = pendingCommandRequest("three");
    ledger.observeDispatch(third, 100);
    ledger.observeOutcome(pendingCommandOutcome("dispatched", "three"), 100);
    ledger.observeDispatch(pendingCommandFinished("three", 103), 100);
    expect(ledger.snapshot(2).resources?.food).toBe(105);
    expect(ledger.snapshot(2).gaps).toEqual([
      "pending_dispatch_application_exception", "pending_dispatch_outcome_uncertain",
      "pending_dispatch_receipt_mismatch", "pending_dispatch_schedule_mismatch"
    ]);
    ledger.dispose();
    expect(ledger.snapshot(2)).toMatchObject({ commands: [], gaps: [], resources: { food: 0 } });
  });

  it("bounds pending ownership and exposes overflow instead of treating omitted commands as zero cost", () => {
    const ledger = new AiRuntimePendingCommands();
    for (let index = 0; index < 129; index++) {
      ledger.observeDispatch(pendingCommandRequest(String(index)), 100);
      ledger.observeOutcome(pendingCommandOutcome("dispatched", String(index)), 100);
      ledger.observeDispatch(pendingCommandFinished(String(index)), 100);
    }
    const result = ledger.snapshot(2);
    expect(result.commands).toHaveLength(128);
    expect(result.resources?.food).toBe(4480);
    expect(result.gaps).toContain("pending_dispatch_admission_overflow_or_duplicate");
  });

  it("rejects duplicate claims and marks aggregate overflow explicitly unknown", () => {
    const ledger = new AiRuntimePendingCommands();
    const duplicate = pendingCommandRequest("duplicate");
    ledger.observeDispatch({ ...duplicate, claims: [...duplicate.claims, ...duplicate.claims] }, 100);
    ledger.observeOutcome(pendingCommandOutcome("dispatched", "duplicate"), 100);
    expect(ledger.snapshot(2).commands).toEqual([]);
    expect(ledger.snapshot(2).gaps).toContain("pending_dispatch_invalid_admission");
    for (const suffix of ["large-one", "large-two"]) {
      const request = pendingCommandRequest(suffix);
      ledger.observeDispatch({ ...request, claims: [{ kind: "resource", claimId: `claim:${suffix}`,
        resourceType: ResourceType.Food, amount: Number.MAX_VALUE }] }, 100);
      ledger.observeOutcome(pendingCommandOutcome("dispatched", suffix), 100);
      ledger.observeDispatch(pendingCommandFinished(suffix), 100);
    }
    expect(ledger.snapshot(2).commands).toHaveLength(2);
    expect(ledger.snapshot(2).resources).toBeNull();
    expect(ledger.snapshot(2).gaps).toContain("pending_dispatch_resource_overflow");
  });
});
