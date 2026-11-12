import Phaser from "phaser";
import { Subject } from "rxjs";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { getCommunicator } from "../../../data/scene-data";
import { SnapshotService } from "./snapshot.service";

jest.mock("../../../data/scene-data", () => ({ getCommunicator: jest.fn() }));
jest.mock("../simulation-time", () => ({
  CancelableSimDelay: jest.fn().mockImplementation(() => ({ remove: jest.fn() }))
}));

describe("SnapshotService host lifecycle", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("owns only one interval, request listener and shutdown listener across host replacement", () => {
    const requests = new Subject<unknown>();
    jest.mocked(getCommunicator).mockReturnValue({ snapshotRequested: { on: requests } } as never);
    const events = new Phaser.Events.EventEmitter();
    const scene = { isHost: true, userId: "host", events } as unknown as ProbableWaffleScene;
    const service = new SnapshotService();

    service.init(scene);
    service.init(scene);
    expect(jest.getTimerCount()).toBe(1);
    expect(requests.observers).toHaveLength(1);
    expect(events.listenerCount(Phaser.Scenes.Events.SHUTDOWN)).toBe(1);

    service.destroy();
    expect(jest.getTimerCount()).toBe(0);
    expect(requests.observers).toHaveLength(0);
    expect(events.listenerCount(Phaser.Scenes.Events.SHUTDOWN)).toBe(0);

    service.init(scene, true);
    expect(jest.getTimerCount()).toBe(1);
    expect(requests.observers).toHaveLength(1);
    expect(events.listenerCount(Phaser.Scenes.Events.SHUTDOWN)).toBe(1);
    service.destroy();
  });
});
