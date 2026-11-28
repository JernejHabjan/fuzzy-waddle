import { CameraMovementHandler } from "../cameraMovementHandler";
import GameProbableWaffleScene from "../../../world/scenes/GameProbableWaffleScene";

function createCameraHandler(player: unknown) {
  const scene = Object.create(GameProbableWaffleScene.prototype);
  Object.defineProperties(scene, {
    playerOrNull: { value: player },
    isSpectator: { value: player === null }
  });
  const camera = { scrollX: 40, scrollY: 60, width: 800, height: 600 };
  const handler = Object.create(CameraMovementHandler.prototype);
  const clamp = jest.fn();
  Object.assign(handler, { scene, mainCamera: camera, clampCameraToBounds: clamp });
  return { handler, camera, clamp };
}

describe("CameraMovementHandler", () => {
  it("keeps the map camera position for a spectator without a player slot", () => {
    const { handler, camera, clamp } = createCameraHandler(null);

    Reflect.get(handler, "centerCameraOnSpawnPoint").call(handler);

    expect(camera).toMatchObject({ scrollX: 40, scrollY: 60 });
    expect(clamp).not.toHaveBeenCalled();
  });

  it("preserves a zoom-only restored camera instead of applying the fresh-game default", () => {
    const { handler, camera } = createCameraHandler(null);
    const center = jest.fn();
    Object.assign(handler, {
      config: { defaultCameraDistance: 1, maximumCameraDistance: 0.5 },
      centerCameraOnSpawnPoint: center
    });
    handler.setCameraState({ zoom: 2 });
    Reflect.get(handler, "create").call(handler);
    expect(camera).toMatchObject({ zoom: 2 });
    expect(center).not.toHaveBeenCalled();
  });

  it("centers on the local player's spawn point when one exists", () => {
    const player = {
      playerController: {
        data: { playerDefinition: { initialWorldLogicalSpawnPosition: { x: 500, y: 400 } } }
      }
    };
    const { handler, camera, clamp } = createCameraHandler(player);

    Reflect.get(handler, "centerCameraOnSpawnPoint").call(handler);

    expect(camera).toMatchObject({ scrollX: 100, scrollY: 100 });
    expect(clamp).toHaveBeenCalledTimes(1);
  });
});
