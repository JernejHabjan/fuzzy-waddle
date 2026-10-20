import { EventEmitter } from "node:events";
import { Subject } from "rxjs";
import type { GameCommandOutcome } from "@fuzzy-waddle/probable-waffle-protocol";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { SimulationTickService } from "../../../world/services/simulation-tick.service";
import { CommandBusService } from "../../../world/services/multiplayer/command-bus.service";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { deliverAiCommandOutcome } from "../ai-command-outcome-delivery";
import { AI_INTENT_COMMAND_DISPATCH_EVENT } from "../ai-intent-command-dispatch-event";
import { installAiRuntimeReceiptFault } from "./install-ai-runtime-receipt-fault";
import type { AiRuntimePresetWorldV1 } from "./ai-runtime-preset-world-v1";
import { AI_RUNTIME_AUTHORITY_DELIVERY_EVENT } from "./ai-runtime-authority-delivery-v1";

jest.mock("../../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));

function deliveryFixture() {
  const ticks = new Subject<void>(), shutdown = new Subject<void>(), events = new EventEmitter();
  const clock = { currentTick: 1, tick$: ticks.asObservable() }, bus = {} as CommandBusService;
  (getSceneService as jest.Mock).mockImplementation((_scene, service) =>
    service === SimulationTickService ? clock : service === CommandBusService ? bus : service === ActorIndexSystem ? {} : null);
  const scene = { events, onShutdown: shutdown.asObservable() } as unknown as ProbableWaffleScene;
  const preset = { receiptFault: { id: "original-receipt", playerNumber: 2, fromTick: 1, throughTick: 10,
    maximumCommands: 1, commandKind: "any" } } as AiRuntimePresetWorldV1;
  const outcome: GameCommandOutcome = { schemaVersion: 1, playerNumber: 2, commandId: "original",
    commitmentKey: "original-effect", effectId: "original-effect", authorityEpoch: 0, sequence: 1,
    tick: 2, kind: "completed", reason: "applied", actorIds: ["worker"], worldLinkIds: [] };
  installAiRuntimeReceiptFault(scene, preset);
  events.emit(AI_INTENT_COMMAND_DISPATCH_EVENT, { kind: "requested", playerNumber: 2,
    command: { type: "STOP", actorIds: ["worker"], playerNumber: 2 },
    correlation: { effectId: outcome.effectId } });
  return { ticks, shutdown, events, clock, bus, outcome };
}

it("releases original callbacks FIFO at a fixed tick and detaches the scoped listeners", () => {
  const f = deliveryFixture(), received: GameCommandOutcome[] = [], phases: string[] = [];
  f.events.on(AI_RUNTIME_AUTHORITY_DELIVERY_EVENT, (value) => phases.push(value.phase));
  deliverAiCommandOutcome(f.bus, f.outcome, (value) => received.push(value));
  deliverAiCommandOutcome(f.bus, { ...f.outcome, tick: 3, kind: "failed" }, (value) => received.push(value));
  expect(received).toEqual([]);
  f.clock.currentTick = 10; f.ticks.next(); expect(received).toEqual([]);
  f.clock.currentTick = 11; f.ticks.next();
  expect(received.map((value) => value.tick)).toEqual([2, 3]);
  expect(phases).toEqual(["held", "held", "released", "released"]);
  expect(f.events.listenerCount(AI_INTENT_COMMAND_DISPATCH_EVENT)).toBe(0);
  f.shutdown.next();
});

it("drops held scene work on shutdown and restores direct delivery for later owners", () => {
  const f = deliveryFixture(), received = jest.fn();
  deliverAiCommandOutcome(f.bus, f.outcome, received);
  f.shutdown.next(); f.clock.currentTick = 11; f.ticks.next();
  expect(received).not.toHaveBeenCalled();
  expect(f.events.listenerCount(AI_INTENT_COMMAND_DISPATCH_EVENT)).toBe(0);
  deliverAiCommandOutcome(f.bus, f.outcome, received);
  expect(received).toHaveBeenCalledTimes(1);
});
