// You can write more code here

/* START OF COMPILED CODE */

import OnPointerDownScript from "../../../../../../shared/game/phaser/script-nodes-basic/OnPointerDownScript";
import PushActionScript from "../../../../../../shared/game/phaser/script-nodes/PushActionScript";
import OnPointerUpScript from "../../../../../../shared/game/phaser/script-nodes-basic/OnPointerUpScript";
import EmitEventActionScript from "../../../../../../shared/game/phaser/script-nodes-basic/EmitEventActionScript";
/* START-USER-IMPORTS */
import HudProbableWaffle from "../../../../world/scenes/hud-scenes/HudProbableWaffle";
import { getSceneService } from "../../../../world/services/scene-component-helpers";
import { NavigationDebugService } from "../../../../world/services/navigation-debug.service";
/* END-USER-IMPORTS */

export default class NavigationDebugToggle extends Phaser.GameObjects.Container {

  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 254.70962821408654, y ?? 10);

    // button
    const button = scene.add.container(-219.66789058312338, 14.222835343264288);
    button.setInteractive(new Phaser.Geom.Rectangle(-32, -13, 254, 28), Phaser.Geom.Rectangle.Contains);
    this.add(button);

    // background
    const background = scene.add.nineslice(95, 0, "gui", "cryos_mini_gui/buttons/button_small.png", 125, 20, 3, 3, 3, 3);
    background.scaleX = 2;
    background.scaleY = 1.55;
    button.add(background);

    // buttonText
    const buttonText = scene.add.text(95, -1, "", {});
    buttonText.setOrigin(0.5, 0.5);
    buttonText.text = "Show navigation debugging";
    buttonText.setStyle({ "color": "#000000ff", "fontFamily": "disposabledroid", "fontSize": "20px", "resolution": 10 });
    button.add(buttonText);

    // onPointerDownScript
    const onPointerDownScript = new OnPointerDownScript(button);

    // pushActionScript
    new PushActionScript(onPointerDownScript);

    // onPointerUpScript
    const onPointerUpScript = new OnPointerUpScript(button);

    // emitEventActionScript
    const emitEventActionScript = new EmitEventActionScript(onPointerUpScript);

    // emitEventActionScript (prefab fields)
    emitEventActionScript.eventName = "action";

    this.buttonText = buttonText;
    this.button = button;

    /* START-USER-CTR-CODE */
    this.init();
    /* END-USER-CTR-CODE */
  }

  private buttonText: Phaser.GameObjects.Text;
  private button: Phaser.GameObjects.Container;

  /* START-USER-CODE */
  private init(): void {
    this.button.on("action", this.toggleNavigationDebugging, this);
    this.scene.events.on(NavigationDebugService.ChangedEvent, this.handleDebugChanged, this);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    this.refreshButtonText();
  }

  private toggleNavigationDebugging(): void {
    const debugService = this.getDebugService();
    if (!debugService) return;
    debugService.setEnabled(!debugService.isEnabled());
  }

  private handleDebugChanged(): void {
    this.refreshButtonText();
  }

  private refreshButtonText(): void {
    const debugService = this.getDebugService();
    this.buttonText.text = debugService?.isEnabled() ? "Hide navigation debugging" : "Show navigation debugging";
  }

  private getDebugService(): NavigationDebugService | undefined {
    const mainScene = (this.scene as HudProbableWaffle).probableWaffleScene;
    return mainScene ? getSceneService(mainScene, NavigationDebugService) : undefined;
  }

  override destroy(fromScene?: boolean): void {
    this.button.off("action", this.toggleNavigationDebugging, this);
    this.scene?.events.off(NavigationDebugService.ChangedEvent, this.handleDebugChanged, this);
    super.destroy(fromScene);
  }
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
