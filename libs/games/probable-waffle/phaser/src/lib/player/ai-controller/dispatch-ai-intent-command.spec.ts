import Phaser from "phaser";
import type { ProbableWaffleScene } from "../../core/probable-waffle.scene";
import type { CommandBusService, GameCommandDispatchReceipt } from "../../world/services/multiplayer/command-bus.service";
import { AI_INTENT_COMMAND_DISPATCH_EVENT, type AiIntentCommandDispatchEvent } from "./ai-intent-command-dispatch-event";
import { dispatchAiIntentCommand } from "./dispatch-ai-intent-command";
import { pendingCommandIntent, pendingCommandRequest, pendingCommandFinished } from
  "./testing/ai-runtime-pending-command-fixtures";

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
    f.dispatchAi.mockImplementation(() => { order.push("authority_applied"); return f.finished.receipt; });
    const intent = pendingCommandIntent();
    dispatchAiIntentCommand(f.scene, f.bus, pendingCommandRequest().command, intent);
    expect(order).toEqual(["requested", "authority_applied", "finished"]);
    expect(recorded[0]).toEqual(pendingCommandRequest());
    expect(recorded[1]).toEqual(f.finished);
    expect(recorded[0].kind === "requested" && recorded[0].claims).not.toBe(intent.claims);
    expect(recorded[1].kind === "finished" && recorded[1].receipt).not.toBe(f.finished.receipt);
  });

  it("retains rejection or exception without fabricating a dispatched command or swallowing the shared failure", () => {
    const f = fixture();
    const kinds: string[] = [];
    f.events.on(AI_INTENT_COMMAND_DISPATCH_EVENT, (event: AiIntentCommandDispatchEvent) => kinds.push(event.kind));
    const rejected = { status: "rejected", reason: "invalid_owner" } satisfies GameCommandDispatchReceipt;
    f.dispatchAi.mockReturnValue(rejected);
    expect(dispatchAiIntentCommand(f.scene, f.bus, pendingCommandRequest().command, pendingCommandIntent())).toBe(rejected);
    const failure = new Error("shared_authority_failure");
    f.dispatchAi.mockImplementation(() => { throw failure; });
    expect(() => dispatchAiIntentCommand(f.scene, f.bus, pendingCommandRequest().command, pendingCommandIntent()))
      .toThrow(failure);
    expect(kinds).toEqual(["requested", "finished", "requested", "threw"]);
  });
});
