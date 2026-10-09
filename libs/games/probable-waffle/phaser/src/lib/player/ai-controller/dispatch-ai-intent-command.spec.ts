import Phaser from "phaser";
import { requireAiTestEntry } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/testing/ai-test-fixtures";
import type { ProbableWaffleScene } from "../../core/probable-waffle.scene";
import type {
  CommandBusService,
  GameCommandDispatchReceipt
} from "../../world/services/multiplayer/command-bus.service";
import {
  AI_INTENT_COMMAND_DISPATCH_EVENT,
  type AiIntentCommandDispatchEvent
} from "./ai-intent-command-dispatch-event";
import { dispatchAiIntentCommand } from "./dispatch-ai-intent-command";
import {
  pendingCommandIntent,
  pendingCommandRequest,
  pendingCommandFinished
} from "./testing/ai-runtime-pending-command-fixtures";

function fixture() {
  const events = new Phaser.Events.EventEmitter();
  const scene = { events } as unknown as ProbableWaffleScene;
  const finished = pendingCommandFinished();
  const dispatchAi = jest.fn((): GameCommandDispatchReceipt => finished.receipt);
  const bus = { dispatchAi } as unknown as CommandBusService;
  return { events, scene, dispatchAi, bus, finished };
}

describe("dispatchAiIntentCommand", () => {
  it("keeps the original bus call and receipt when no diagnostic listener is installed", () => {
    const f = fixture();
    const input = pendingCommandRequest().command;
    const receipt = dispatchAiIntentCommand(f.scene, f.bus, input, pendingCommandIntent());
    expect(receipt).toBe(f.finished.receipt);
    expect(f.dispatchAi).toHaveBeenCalledWith(input, pendingCommandRequest().correlation);
    expect(f.dispatchAi).toHaveBeenCalledTimes(1);
  });

  it("emits detached accepted claims before any synchronous authority callback, then the actual receipt", () => {
    const f = fixture();
    const recorded: AiIntentCommandDispatchEvent[] = [];
    const order: string[] = [];
    f.events.on(AI_INTENT_COMMAND_DISPATCH_EVENT, (event: AiIntentCommandDispatchEvent) => {
      recorded.push(event);
      order.push(event.kind);
    });
    f.dispatchAi.mockImplementation(() => {
      order.push("authority_applied");
      return f.finished.receipt;
    });
    const intent = pendingCommandIntent();
    dispatchAiIntentCommand(f.scene, f.bus, pendingCommandRequest().command, intent);
    expect(order).toEqual(["requested", "authority_applied", "finished"]);
    const requested = requireAiTestEntry(recorded, 0);
    const finished = requireAiTestEntry(recorded, 1);
    expect(requested).toEqual({ ...pendingCommandRequest(), acceptedIntent: intent });
    expect(finished).toEqual(f.finished);
    if (requested.kind !== "requested" || finished.kind !== "finished") throw new Error("dispatch_phases_missing");
    expect(requested.claims).not.toBe(intent.claims);
    expect(requested.acceptedIntent).not.toBe(intent);
    expect(finished.receipt).not.toBe(f.finished.receipt);
  });

  it("detaches the exact decision identity alongside the accepted proposal", () => {
    const f = fixture();
    const recorded: AiIntentCommandDispatchEvent[] = [];
    f.events.on(AI_INTENT_COMMAND_DISPATCH_EVENT, (event: AiIntentCommandDispatchEvent) => recorded.push(event));
    const identity = { playerNumber: 2, tick: 99, generation: 5, decisionSequence: 9, authorityEpoch: 1 };
    dispatchAiIntentCommand(f.scene, f.bus, pendingCommandRequest().command, pendingCommandIntent(), identity);
    const requested = requireAiTestEntry(recorded, 0);
    if (requested.kind !== "requested") throw new Error("dispatch_request_missing");
    expect(requested.decisionIdentity).toEqual(identity);
    expect(requested.decisionIdentity).not.toBe(identity);
    identity.generation = 100;
    expect(requested.decisionIdentity?.generation).toBe(5);
  });

  it("retains rejection or exception without fabricating a dispatched command or swallowing the shared failure", () => {
    const f = fixture();
    const kinds: string[] = [];
    f.events.on(AI_INTENT_COMMAND_DISPATCH_EVENT, (event: AiIntentCommandDispatchEvent) => kinds.push(event.kind));
    const rejected = { status: "rejected", reason: "invalid_owner" } satisfies GameCommandDispatchReceipt;
    f.dispatchAi.mockReturnValue(rejected);
    expect(dispatchAiIntentCommand(f.scene, f.bus, pendingCommandRequest().command, pendingCommandIntent())).toBe(
      rejected
    );
    const failure = new Error("shared_authority_failure");
    f.dispatchAi.mockImplementation(() => {
      throw failure;
    });
    expect(() =>
      dispatchAiIntentCommand(f.scene, f.bus, pendingCommandRequest().command, pendingCommandIntent())
    ).toThrow(failure);
    expect(kinds).toEqual(["requested", "finished", "requested", "threw"]);
  });
});
