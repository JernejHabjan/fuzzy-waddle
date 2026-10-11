import { requireAiTestEntry } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/testing/ai-test-fixtures";
import Phaser from "phaser";
import { Subject } from "rxjs";
import { ConstructionStateEnum, ObjectNames, type ConstructCommand } from "@fuzzy-waddle/probable-waffle-protocol";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { getActorComponent } from "../../../data/actor-component";
import { getActorSystem } from "../../../data/actor-system";
import { getPlayer } from "../../../data/scene-data";
import { BuilderComponent } from "../../../entity/components/construction/builder-component";
import { ConstructionSiteComponent } from "../../../entity/components/construction/construction-site-component";
import { OwnerComponent } from "../../../entity/components/owner-component";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { BuildingCursor } from "../../../player/human-controller/building-cursor";
import { ProductionValidator } from "../../../data/tech-tree/production-validator";
import { getCostForObjectName } from "../../../entity/components/production/cost-utils";
import { getTileCoordsUnderObject } from "../../../library/tile-under-object";
import { getSceneService, getSceneComponent } from "../scene-component-helpers";
import { ActorIndexSystem } from "../ActorIndexSystem";
import { NavigationService } from "../navigation.service";
import { CommandBusService } from "./command-bus.service";
import { IsoHelper } from "../../tilemap/iso-helper";
import {
  PRODUCTION_SPATIAL_AUTHORITY_EVENT,
  type ProductionSpatialAuthorityEvent
} from "./production-spatial-authority-event";
import { applySharedConstructionCommand } from "./apply-shared-construction-command";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../data/actor-system", () => ({ getActorSystem: jest.fn() }));
jest.mock("../../../data/scene-data", () => ({ getPlayer: jest.fn() }));
jest.mock("../../../entity/components/production/cost-utils", () => ({ getCostForObjectName: jest.fn() }));
jest.mock("../../../library/tile-under-object", () => ({ getTileCoordsUnderObject: jest.fn() }));
jest.mock("../scene-component-helpers", () => ({ getSceneService: jest.fn(), getSceneComponent: jest.fn() }));

/** Real shared application function behind synthetic authorities; no legal live-site proof. */
function fixture() {
  const scene = {
    events: new Phaser.Events.EventEmitter(),
    sys: { isActive: () => true, queueDepthSort: jest.fn() }
  } as unknown as ProbableWaffleScene;
  const builder = new Phaser.GameObjects.GameObject(scene, "builder-fixture");
  const site = { scene, active: true, once: jest.fn(), destroy: jest.fn() } as unknown as Phaser.GameObjects.GameObject;
  const changes = new Subject<ConstructionStateEnum>();
  const order: string[] = [];
  const bus = { reportOutcome: jest.fn((_command, kind: string) => order.push(kind)) };
  const execute = jest.fn(() => {
    order.push("assignment");
    return true;
  });
  const navigable = jest.fn(() => true);
  jest.mocked(getActorSystem).mockReturnValue({ executeAction: execute } as never);
  jest.mocked(getSceneComponent).mockReturnValue({ tilemap: {} } as never);
  jest.mocked(getSceneService).mockImplementation((_scene, service) => {
    if (service === CommandBusService) return bus as never;
    if (service === NavigationService) return { isTileGridWithoutBlockingObjectsNavigable: navigable } as never;
    if (service === ActorIndexSystem)
      return { getActorById: () => builder, getAllIdActors: () => [builder, site] } as never;
    return undefined;
  });
  jest.mocked(getActorComponent).mockImplementation((actor, component) => {
    if (component === OwnerComponent) return { getOwner: () => 1 } as never;
    if (component === IdComponent) return { id: actor === site ? "site" : "builder" } as never;
    if (component === BuilderComponent) return { constructableBuildings: [ObjectNames.Sandhold] } as never;
    if (component === ConstructionSiteComponent)
      return {
        buildsWithoutAssignedWorkers: false,
        constructionStateChanged: changes
      } as never;
    return undefined;
  });
  jest.mocked(getPlayer).mockReturnValue({ canPayAllResources: () => true } as never);
  jest.mocked(getCostForObjectName).mockReturnValue({ food: 7 });
  jest.mocked(getTileCoordsUnderObject).mockReturnValue([{ x: 7, y: 9 }] as never);
  jest.spyOn(ProductionValidator, "validateObject").mockReturnValue({ canQueue: true } as never);
  jest.spyOn(BuildingCursor, "spawnBuildingForPlayer").mockReturnValue(site);
  jest.spyOn(IsoHelper, "isometricTileToWorldXY").mockReturnValue({ x: 100, y: 200 });
  const command = {
    type: "CONSTRUCT",
    tick: 20,
    playerNumber: 1,
    actorIds: ["builder"],
    actorName: ObjectNames.Sandhold,
    tileVec3: { x: 7, y: 9, z: 0 },
    siteKey: "site:key"
  } satisfies ConstructCommand;
  const events: ProductionSpatialAuthorityEvent[] = [];
  scene.events.on(PRODUCTION_SPATIAL_AUTHORITY_EVENT, (event: ProductionSpatialAuthorityEvent) => {
    events.push(event);
    order.push("placement");
  });
  return { scene, site, command, events, order, changes, bus, execute, navigable };
}

describe("native construction placement seam", () => {
  afterEach(() => jest.restoreAllMocks());
  it("emits one actual footprint verdict before assignment, retaining native completion and reconciled-site behavior", () => {
    const f = fixture();
    const sites = new Map<string, string>();
    applySharedConstructionCommand(f.scene, f.command, sites, []);
    expect(f.order).toEqual(["placement", "assignment", "applied", "active"]);
    expect(requireAiTestEntry(f.events, 0)).toMatchObject({
      kind: "placement",
      legal: true,
      footprint: [{ x: 7, y: 9 }],
      admissionCost: { food: 7 }
    });
    expect(f.navigable).toHaveBeenCalledTimes(1);
    f.changes.next(ConstructionStateEnum.Finished);
    expect(f.order.at(-1)).toBe("completed");
    applySharedConstructionCommand(f.scene, f.command, sites, []);
    expect(f.events).toHaveLength(1);
    expect(f.execute).toHaveBeenCalledTimes(1);
  });
  it("retains illegal placement before destruction without assigning a builder or adding another check", () => {
    const f = fixture();
    f.navigable.mockReturnValue(false);
    applySharedConstructionCommand(f.scene, f.command, new Map(), []);
    expect(requireAiTestEntry(f.events, 0)).toMatchObject({ legal: false });
    expect(f.site.destroy).toHaveBeenCalledTimes(1);
    expect(f.execute).not.toHaveBeenCalled();
    expect(f.bus.reportOutcome).toHaveBeenCalledWith(
      f.command,
      "rejected",
      "illegal_site",
      ["builder"],
      [],
      "invalid_footprint"
    );
    expect(f.navigable).toHaveBeenCalledTimes(1);
  });
  it("detaches the already checked price and preserves the unobserved native application", () => {
    const f = fixture();
    const cost = { food: 7 };
    jest.mocked(getCostForObjectName).mockReturnValue(cost);
    jest.mocked(BuildingCursor.spawnBuildingForPlayer).mockImplementationOnce(() => {
      cost.food = 99;
      return f.site;
    });
    applySharedConstructionCommand(f.scene, f.command, new Map(), []);
    expect(requireAiTestEntry(f.events, 0)).toMatchObject({ admissionCost: { food: 7 } });
    expect(getCostForObjectName).toHaveBeenCalledWith(f.command.actorName);
    const unobserved = fixture();
    unobserved.scene.events.removeAllListeners(PRODUCTION_SPATIAL_AUTHORITY_EVENT);
    applySharedConstructionCommand(unobserved.scene, unobserved.command, new Map(), []);
    expect(unobserved.events).toEqual([]);
    expect(unobserved.execute).toHaveBeenCalledTimes(1);
    expect(unobserved.order).toEqual(["assignment", "applied", "active"]);
  });
});
