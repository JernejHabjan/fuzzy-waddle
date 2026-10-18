import Phaser from "phaser";
import { Subject } from "rxjs";
import { getCommunicator } from "../../../data/scene-data";
import { getSceneService } from "../scene-component-helpers";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { ProbableWaffleSceneEventName } from "./probable-waffle-scene-events";
import { StateHashService } from "./state-hash.service";

jest.mock("../../../data/scene-data", () => ({ getCommunicator: jest.fn() }));
jest.mock("../scene-component-helpers", () => ({ getSceneService: jest.fn() }));

describe("state-hash match ownership", () => {
  it("replaces subscriptions and fences an old scene shutdown without detaching the new match", () => {
    const ticks = new Subject<number>();
    const hashes = new Subject<unknown>();
    jest.mocked(getCommunicator).mockReturnValue({ stateHashChanged: { on: hashes, send: jest.fn() } } as never);
    jest.mocked(getSceneService).mockReturnValue({ tick$: ticks } as never);
    const scene = () => ({ events: new Phaser.Events.EventEmitter(), userId: "local" }) as unknown as ProbableWaffleScene;
    const first = scene();
    const second = scene();
    const service = new StateHashService();
    service.init(first);
    service.init(first);
    expect(ticks.observers).toHaveLength(1);
    expect(hashes.observers).toHaveLength(1);
    expect(first.events.listenerCount(Phaser.Scenes.Events.SHUTDOWN)).toBe(1);
    expect(first.events.listenerCount(ProbableWaffleSceneEventName.ReconnectSnapshotApplied)).toBe(1);
    service.init(second);
    expect(first.events.listenerCount(Phaser.Scenes.Events.SHUTDOWN)).toBe(0);
    expect(first.events.listenerCount(ProbableWaffleSceneEventName.ReconnectSnapshotApplied)).toBe(0);
    first.events.emit(Phaser.Scenes.Events.SHUTDOWN);
    expect(ticks.observers).toHaveLength(1);
    expect(hashes.observers).toHaveLength(1);
    second.events.emit(Phaser.Scenes.Events.SHUTDOWN);
    expect(ticks.observers).toHaveLength(0);
    expect(hashes.observers).toHaveLength(0);
    expect(second.events.listenerCount(ProbableWaffleSceneEventName.ReconnectSnapshotApplied)).toBe(0);
  });
});
