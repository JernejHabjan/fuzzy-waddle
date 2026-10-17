import { Subject } from "rxjs";
import type { ProbableWaffleHostMigratedEvent } from "@fuzzy-waddle/probable-waffle-protocol";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { getCommunicator } from "../../../data/scene-data";
import { getSceneService, getSceneSystem } from "../scene-component-helpers";
import { HostMigrationService } from "./host-migration.service";
import type { SnapshotService } from "./snapshot.service";

jest.mock("../../../data/scene-data", () => ({ getCommunicator: jest.fn() }));
jest.mock("../scene-component-helpers", () => ({ getSceneService: jest.fn(), getSceneSystem: jest.fn() }));
jest.mock("../multiplayer/multiplayer-client-logger", () => ({
  createMultiplayerClientLogger: () => ({ info: jest.fn() })
}));

describe("HostMigrationService AI and snapshot handoff", () => {
  it("fences the old host and reuses one snapshot owner when authority returns", () => {
    const events = new Subject<ProbableWaffleHostMigratedEvent>();
    jest.mocked(getCommunicator).mockReturnValue({ hostMigrated: { on: events } } as never);
    const advanceAuthorityEpoch = jest.fn();
    jest.mocked(getSceneService).mockReturnValue({
      getAuthorityState: () => ({ authorityEpoch: 4 }), advanceAuthorityEpoch
    } as never);
    const setHostAuthorityActive = jest.fn();
    jest.mocked(getSceneSystem).mockReturnValue({ setHostAuthorityActive } as never);
    const snapshot = { init: jest.fn(), destroy: jest.fn() } as unknown as SnapshotService;
    const scene = {
      userId: "old-host",
      baseGameData: { gameInstance: { gameInstanceMetadata: { isReplay: () => false } } },
      events: { once: jest.fn() }
    } as unknown as ProbableWaffleScene;
    const migration = new HostMigrationService();
    migration.init(scene, snapshot);

    events.next({ previousHostUserId: "old-host", currentHostUserId: "new-host" } as ProbableWaffleHostMigratedEvent);
    expect(advanceAuthorityEpoch).toHaveBeenCalledWith(5);
    expect(setHostAuthorityActive).toHaveBeenLastCalledWith(false);
    expect(snapshot.destroy).toHaveBeenCalledTimes(1);
    expect(snapshot.init).not.toHaveBeenCalled();

    events.next({ previousHostUserId: "new-host", currentHostUserId: "old-host" } as ProbableWaffleHostMigratedEvent);
    expect(setHostAuthorityActive).toHaveBeenLastCalledWith(true);
    expect(snapshot.init).toHaveBeenCalledWith(scene, true);
    migration.destroy();
  });
});
