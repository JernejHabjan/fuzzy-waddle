import Phaser from "phaser";
import { HealthComponent } from "../combat/components/health-component";
import { BuilderComponent } from "./builder-component";
import { ConstructionSiteComponent } from "./construction-site-component";
import { getActorComponent } from "../../../data/actor-component";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../data/game-object-helper", () => ({ onObjectReady: jest.fn() }));

function fixture() {
  const events = new Phaser.Events.EventEmitter();
  const sceneEvents = new Phaser.Events.EventEmitter();
  const worker = {
    once: events.once.bind(events),
    off: events.off.bind(events),
    scene: { events: sceneEvents }
  } as unknown as Phaser.GameObjects.GameObject;
  const oldSite = {} as Phaser.GameObjects.GameObject;
  const newSite = {} as Phaser.GameObjects.GameObject;
  const old = {
    canAssignBuilder: jest.fn(() => true),
    assignBuilder: jest.fn(),
    unAssignBuilder: jest.fn(),
    unAssignRepairer: jest.fn()
  };
  const next = {
    canAssignBuilder: jest.fn(() => true),
    assignBuilder: jest.fn(),
    unAssignBuilder: jest.fn(),
    unAssignRepairer: jest.fn()
  };
  let lost = false;
  jest
    .mocked(getActorComponent)
    .mockImplementation((actor, token) =>
      token === ConstructionSiteComponent ? ((actor === oldSite ? (lost ? undefined : old) : next) as never) : undefined
    );
  const builder = new BuilderComponent(worker, {
    enterConstructionSite: false,
    constructionSiteOffset: 1,
    constructableBuildings: {}
  });
  return {
    events,
    sceneEvents,
    builder,
    worker,
    oldSite,
    newSite,
    old,
    next,
    loseOldSite: () => {
      lost = true;
    }
  };
}

describe("construction worker membership", () => {
  beforeEach(() => jest.clearAllMocks());
  it("releases construction membership at scene shutdown and rejects later assignment or restore callbacks", () => {
    const f = fixture();
    f.builder.assignToConstructionSite(f.oldSite);
    f.sceneEvents.emit(Phaser.Scenes.Events.SHUTDOWN);
    f.builder.assignToConstructionSite(f.newSite);
    f.builder.setData({ assignedConstructionSiteId: "late-site" });
    expect(f.old.unAssignBuilder).toHaveBeenCalledTimes(1);
    expect(f.next.assignBuilder).not.toHaveBeenCalled();
    expect(f.builder.isIdle()).toBe(true);
    expect(f.sceneEvents.listenerCount(Phaser.Scenes.Events.SHUTDOWN)).toBe(0);
  });
  it("transfers progress membership to the new site and releases the old slot exactly once", () => {
    const f = fixture();
    f.builder.assignToConstructionSite(f.oldSite);
    f.builder.assignToConstructionSite(f.newSite);
    f.builder.assignToConstructionSite(f.newSite);
    expect(f.old.unAssignBuilder).toHaveBeenCalledTimes(1);
    expect(f.old.unAssignBuilder).toHaveBeenCalledWith(f.worker);
    expect(f.next.assignBuilder).toHaveBeenCalledTimes(1);
    expect(f.builder.getAssignedConstructionSite()).toBe(f.newSite);
  });
  it("clears a vanished site's reference so the worker can return to useful work", () => {
    const f = fixture();
    f.builder.assignToConstructionSite(f.oldSite);
    f.loseOldSite();
    f.builder.leaveConstructionSite();
    expect(f.builder.isIdle()).toBe(true);
    f.builder.assignToConstructionSite(f.newSite);
    expect(f.next.assignBuilder).toHaveBeenCalledTimes(1);
  });
  it("keeps healthy old membership when a new site has no free slot", () => {
    const f = fixture();
    f.builder.assignToConstructionSite(f.oldSite);
    f.next.canAssignBuilder.mockReturnValue(false);
    f.builder.assignToConstructionSite(f.newSite);
    expect(f.old.unAssignBuilder).not.toHaveBeenCalled();
    expect(f.builder.getAssignedConstructionSite()).toBe(f.oldSite);
  });
  it("removes a dead worker from both construction and repair progress membership once", () => {
    const f = fixture();
    f.builder.assignToConstructionSite(f.oldSite);
    f.events.emit(HealthComponent.KilledEvent);
    // Native Phaser destruction is also a cleanup boundary after a death animation.
    f.events.emit(Phaser.GameObjects.Events.DESTROY);
    expect(f.old.unAssignBuilder).toHaveBeenCalledTimes(1);
    expect(f.old.unAssignRepairer).toHaveBeenCalledTimes(1);
    expect(f.builder.isIdle()).toBe(true);
  });
});
