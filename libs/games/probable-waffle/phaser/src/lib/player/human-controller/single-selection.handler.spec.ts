import Phaser from "phaser";
import { SingleSelectionHandler } from "./single-selection.handler";
import { ProbableWaffleScene } from "../../core/probable-waffle.scene";
import { getActorComponent } from "../../data/actor-component";
import { getSelectableGameObject, onSceneInitialized } from "../../data/game-object-helper";
import { IsoHelper } from "../../world/tilemap/iso-helper";
import { getSceneComponent } from "../../world/services/scene-component-helpers";

jest.mock("../../data/actor-component");
jest.mock("../../data/game-object-helper");
jest.mock("../../world/tilemap/iso-helper");
jest.mock("../../world/services/scene-component-helpers");

describe("SingleSelectionHandler", () => {
  const pointerUpEvent = "pointerup";
  let pointerUpHandler: (pointer: Phaser.Input.Pointer, gameObjects: Phaser.GameObjects.GameObject[]) => void;
  let emittedEvents: unknown[];
  let scene: object;
  let hudScene: object;

  beforeEach(() => {
    (Phaser.Input as typeof Phaser.Input & { Events: { POINTER_UP: string } }).Events = {
      POINTER_UP: pointerUpEvent
    };
    emittedEvents = [];
    scene = {
      input: {
        on: jest.fn((_event, handler) => {
          pointerUpHandler = handler;
        }),
        off: jest.fn()
      },
      events: { once: jest.fn() },
      communicator: { allScenes: { emit: jest.fn((event) => emittedEvents.push(event)) } },
      cameras: { main: { getWorldPoint: jest.fn(() => ({ x: 10, y: 20 })) } }
    };
    hudScene = { events: { on: jest.fn(), off: jest.fn() } };

    (onSceneInitialized as jest.Mock).mockImplementation(() => undefined);
    (IsoHelper.isometricWorldToTileXY as jest.Mock).mockReturnValue({ x: 1, y: 1 });
    (getSelectableGameObject as jest.Mock).mockImplementation((gameObject) => gameObject);
    (getActorComponent as jest.Mock).mockReturnValue({ id: "actor-1" });
    (getSceneComponent as jest.Mock).mockReturnValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("keeps repeated right-clicks as commands instead of emitting a double selection", () => {
    const handler = createHandler(scene, hudScene);
    jest.spyOn(Date, "now").mockReturnValueOnce(100).mockReturnValueOnce(200);

    pointerUpHandler(createPointer(false, true), [{} as Phaser.GameObjects.GameObject]);
    pointerUpHandler(createPointer(false, true), [{} as Phaser.GameObjects.GameObject]);

    expect(emittedEvents).toEqual([
      {
        name: "selection.singleSelect",
        data: { button: "right", objectIds: ["actor-1"], shiftKey: false, ctrlKey: false }
      },
      {
        name: "selection.singleSelect",
        data: { button: "right", objectIds: ["actor-1"], shiftKey: false, ctrlKey: false }
      }
    ]);
  });

  it("still emits a double selection for two quick left-clicks on the same actor", () => {
    const handler = createHandler(scene, hudScene);
    jest.spyOn(Date, "now").mockReturnValueOnce(100).mockReturnValueOnce(200);

    pointerUpHandler(createPointer(true, false), [{} as Phaser.GameObjects.GameObject]);
    pointerUpHandler(createPointer(true, false), [{} as Phaser.GameObjects.GameObject]);

    expect(emittedEvents).toEqual([
      {
        name: "selection.singleSelect",
        data: { button: "left", objectIds: ["actor-1"], shiftKey: false, ctrlKey: false }
      },
      { name: "selection.doubleSelect", data: { objectId: "actor-1" } }
    ]);
  });
});

function createPointer(leftButtonReleased: boolean, rightButtonReleased: boolean): Phaser.Input.Pointer {
  return {
    leftButtonReleased: () => leftButtonReleased,
    rightButtonReleased: () => rightButtonReleased,
    event: { shiftKey: false, ctrlKey: false }
  } as Phaser.Input.Pointer;
}

function createHandler(scene: object, hudScene: object): SingleSelectionHandler {
  const handler = new SingleSelectionHandler(
    scene as ProbableWaffleScene,
    hudScene as ProbableWaffleScene,
    { width: 10, height: 10 } as Phaser.Tilemaps.Tilemap
  );
  (handler as unknown as { playerActionsHandler: { isHandlingActions: () => boolean } }).playerActionsHandler = {
    isHandlingActions: () => false
  };
  return handler;
}
