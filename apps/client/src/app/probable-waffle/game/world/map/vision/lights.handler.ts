import ActorContainer from "../../../entity/actor/ActorContainer";

export class LightsHandler {
  private lights!: Phaser.GameObjects.LightsManager;

  constructor(
    private readonly scene: Phaser.Scene,
    config: {
      enableLights: boolean;
    } = {
      enableLights: true
    }
  ) {
    if (!config.enableLights) return;
    this.lights = this.scene.lights;

    this.enableLights();
    this.moveLightToPointer();
  }

  enableLights = () => {
    const children = this.scene.children;

    // add lights2d pipeline to all children
    children.each((child: any) => {
      if (child.setPipeline) {
        child.setPipeline("Light2D");
      }
      // if instanceOf ActorContainer, then add lights2d pipeline to all children of the container
      if (child instanceof ActorContainer) {
        child.each((child: any) => {
          if (child.setPipeline) {
            child.setPipeline("Light2D");
          }
        });
      }
    });

    this.lights.enable();
    this.lights.setAmbientColor(0x808080);
  };

  moveLightToPointer = () => {
    const spotlight = this.lights.addLight(0, 0, 280).setIntensity(2).setColor(0xffffff);

    const mainCamera = this.scene.cameras.main;
    const input = this.scene.input;

    input.on("pointermove", (pointer: any) => {
      const cameraX = mainCamera.scrollX;
      const cameraY = mainCamera.scrollY;
      const zoom = mainCamera.zoom;

      // Adjust the pointer position based on the inverse of the zoom
      const adjustedPointerX = (pointer.x + cameraX) / zoom;
      const adjustedPointerY = (pointer.y + cameraY) / zoom;

      spotlight.x = adjustedPointerX;
      spotlight.y = adjustedPointerY;
    });
  };
}
