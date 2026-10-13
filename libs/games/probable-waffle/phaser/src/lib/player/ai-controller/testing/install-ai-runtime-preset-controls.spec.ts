import Phaser from "phaser";
import { Subject } from "rxjs";
import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { getActorComponent } from "../../../data/actor-component";
import { OwnerComponent } from "../../../entity/components/owner-component";
import { QueueComponent } from "../../../entity/components/queue/queue-component";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { SimulationTickService } from "../../../world/services/simulation-tick.service";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import type { AiRuntimePresetWorldV1 } from "./ai-runtime-preset-world-v1";
import { AI_RUNTIME_PRESET_CONTROL_EVENT, type AiRuntimePresetControlEvent } from "./ai-runtime-preset-control-event";
import { installAiRuntimePresetControls } from "./install-ai-runtime-preset-controls";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));

function fixture() {
  const tick$ = new Subject<number>(),
    onShutdown = new Subject<void>();
  const clock = { currentTick: 0, tick$ };
  const scene = { events: new Phaser.Events.EventEmitter(), onShutdown } as unknown as ProbableWaffleScene;
  const producer = { scene, active: true } as unknown as Phaser.GameObjects.GameObject;
  const paid = {
    productionData: { actorName: ObjectNames.TivaraMacemanMale },
    commandContext: { execution: { commandId: "paid-tail" } }
  };
  const allItems = [{ productionData: { actorName: ObjectNames.TivaraMacemanMale } }, paid];
  jest
    .mocked(getActorComponent)
    .mockImplementation(
      (_actor, component) =>
        (component === IdComponent
          ? { id: "producer" }
          : component === OwnerComponent
            ? { getOwner: () => 2 }
            : component === QueueComponent
              ? { allItems }
              : undefined) as never
    );
  const dispatchDeterministic = jest.fn((input) => ({
    status: "dispatched",
    command: { ...input, tick: clock.currentTick, execution: { source: "human", commandId: "native-cancel" } }
  }));
  const bus = { dispatchDeterministic, commandOutcome$: new Subject() };
  jest
    .mocked(getSceneService)
    .mockImplementation((_scene, service) => (service === SimulationTickService ? clock : bus) as never);
  const records: AiRuntimePresetControlEvent[] = [];
  scene.events.on(AI_RUNTIME_PRESET_CONTROL_EVENT, (event: AiRuntimePresetControlEvent) => records.push(event));
  const preset: AiRuntimePresetWorldV1 = {
    fixtureId: "controlled-refund",
    actors: [],
    resourceGrants: [],
    provenance: { sourceRevision: "a".repeat(40), fixtureDigest: "fnv1a32:00000000" },
    controls: [
      {
        id: "cancel-paid-tail",
        requestTick: 1,
        applicationTick: 4,
        producerFixtureActorId: "producer",
        action: { kind: "cancel_production", setupQueueIndex: 1 }
      }
    ]
  };
  installAiRuntimePresetControls(scene, preset, new Map([["producer", producer]]));
  const advance = (tick: number) => {
    clock.currentTick = tick;
    tick$.next(tick);
  };
  return { advance, records, allItems, dispatchDeterministic, tick$, onShutdown };
}

it("records request separately, then resolves the original paid handle after the queue index changes", () => {
  const f = fixture();
  f.advance(1);
  expect(f.dispatchDeterministic).not.toHaveBeenCalled();
  expect(f.records[0]).toMatchObject({
    phase: "requested",
    requestedTick: 1,
    scheduledTick: 4,
    setupItemId: "queue:producer:paid-tail",
    command: null
  });
  f.allItems.shift();
  f.advance(4);
  expect(f.dispatchDeterministic).toHaveBeenCalledWith(
    { type: "CANCEL_PRODUCTION", playerNumber: 2, actorIds: ["producer"], queueIndex: 0 },
    "human"
  );
  expect(f.records[1]).toMatchObject({ phase: "applied", command: { execution: { source: "human" } } });
  expect(f.tick$.observed).toBe(false);
  expect(f.onShutdown.observed).toBe(false);
});

it("shutdown detaches pending controls", () => {
  const f = fixture();
  f.onShutdown.next();
  f.advance(4);
  expect(f.dispatchDeterministic).not.toHaveBeenCalled();
});
