import Phaser from "phaser";
import { Subject } from "rxjs";
import { ConstructionStateEnum } from "@fuzzy-waddle/probable-waffle-protocol";
import { getPwActorDefinition } from "../../../prefabs/definitions/actor-definitions";
import { getActorComponent } from "../../../data/actor-component";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { ConstructionSiteComponent } from "./construction-site-component";
import { startConstructionPayment, refundConstructionPayment } from "./construction-payment";
import { CONSTRUCTION_AUTHORITY_EVENT, type ConstructionAuthorityEvent } from "./construction-authority-event";
import type { ConstructionSiteDefinition } from
  "@fuzzy-waddle/probable-waffle-gameplay/entity/components/construction/construction-site-definition";
import { HealthComponent } from "../combat/components/health-component";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../data/scene-data", () => ({ isSnapshotApplyInProgress: () => false }));
jest.mock("../../../data/actor-data", () => ({ upgradeFromConstructingToFullActorData: jest.fn() }));
jest.mock("../../../data/actor-level-utils", () => ({ getResearchedLevelForActor: () => null }));
jest.mock("../../../data/game-object-helper", () => ({ onObjectReady: jest.fn(), getGameObjectVisibility: () => undefined }));
jest.mock("../../../prefabs/definitions/actor-definitions", () => ({ getPwActorDefinition: jest.fn() }));
jest.mock("../../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));
jest.mock("./construction-progress-ui-component", () => ({ ConstructionProgressUiComponent: class {} }));
jest.mock("./construction-payment", () => ({ startConstructionPayment: jest.fn(), refundConstructionPayment: jest.fn() }));

/** Real component state/restore/teardown order with isolated payment calls; no executed live-game proof. */
describe("construction lifecycle boundaries", () => {
  beforeEach(() => jest.clearAllMocks());

  function fixture() {
    const actorEvents = new Phaser.Events.EventEmitter(); const sceneEvents = new Phaser.Events.EventEmitter();
    const ticks = new Subject<number>();
    const site = { name: "site", scene: { events: sceneEvents },
      on: actorEvents.on.bind(actorEvents), once: actorEvents.once.bind(actorEvents) } as unknown as Phaser.GameObjects.GameObject;
    const definition = { components: { productionCost: { costType: 0, productionTime: 150, resources: { food: 11 }, refundFactor: 1 } } };
    jest.mocked(getPwActorDefinition).mockReturnValue(definition as never);
    jest.mocked(getActorComponent).mockReturnValue(undefined);
    jest.mocked(getSceneService).mockReturnValue({ tick$: ticks } as never);
    const records: ConstructionAuthorityEvent[] = [];
    sceneEvents.on(CONSTRUCTION_AUTHORITY_EVENT, (event: ConstructionAuthorityEvent) => records.push(event));
    const policy = { startImmediately: false, consumesBuilders: false, maxAssignedBuilders: 1, maxAssignedRepairers: 1,
      progressMadeAutomatically: 0, progressMadePerBuilder: 1, repairFactor: 1, initialHealthPercentage: 0.1,
      refundFactor: 0.5, canBeDragPlaced: false } satisfies ConstructionSiteDefinition;
    const component = new ConstructionSiteComponent(site, policy);
    return { component, site, actorEvents, records, ticks, definition };
  }

  it("captures real start/restore/finish transitions with actual remaining work and resamples current definitions", () => {
    const f = fixture(); f.component.startConstruction();
    expect(startConstructionPayment).toHaveBeenCalledWith(f.site, f.definition.components.productionCost, 0, 0);
    expect(f.records[0]).toMatchObject({ kind: "lifecycle", transition: "started", state: 1, remainingWorkMs: 150 });
    f.component.setData({ state: ConstructionStateEnum.Constructing, remainingConstructionTime: 75 });
    expect(f.records[1]).toMatchObject({ transition: "restored", remainingWorkMs: 75 });
    f.definition.components.productionCost.resources.food = 20;
    f.component.cancelConstruction();
    expect(refundConstructionPayment).toHaveBeenCalledWith(f.site, f.definition.components.productionCost, 0.5,
      expect.any(Function), ConstructionStateEnum.Constructing, 75);
    f.component.completeConstruction();
    expect(f.records[2]).toMatchObject({ transition: "finished", state: 3, remainingWorkMs: 75 });
    f.component.cancelConstruction(); expect(refundConstructionPayment).toHaveBeenCalledTimes(1);
  });

  it("retains repeated killed/destroy teardown before start and does not invent a terminal/cancellation state", () => {
    const f = fixture(); f.actorEvents.emit(HealthComponent.KilledEvent); f.actorEvents.emit(Phaser.GameObjects.Events.DESTROY);
    expect(f.records.map((record) => [record.kind, record.state, record.remainingWorkMs])).toEqual([
      ["lifecycle", ConstructionStateEnum.NotStarted, 0], ["lifecycle", ConstructionStateEnum.NotStarted, 0]
    ]);
    expect(refundConstructionPayment).toHaveBeenCalledTimes(2);
    expect(f.ticks.observed).toBe(false);
    expect(f.component.getData().state).toBe(ConstructionStateEnum.NotStarted);
  });
});
