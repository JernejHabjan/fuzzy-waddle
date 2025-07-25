// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { getCurrentPlayerNumber, getPlayer, listenToResourceChanged } from "../../../data/scene-data";
import { Subscription } from "rxjs";
import { ProbableWafflePlayer } from "@fuzzy-waddle/api-interfaces";
/* END-USER-IMPORTS */

export default class Resource extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 71.80414581298828, y ?? 32.202178808720916);

    // resource_text
    const resource_text = scene.add.text(-25, -16, "", {});
    resource_text.setOrigin(0.5, 0.5);
    resource_text.text = "0";
    resource_text.setStyle({ fontFamily: "disposabledroid", fontSize: "22px", resolution: 10 });
    this.add(resource_text);

    // resource_icon
    const resource_icon = scene.add.image(-56, -4, "gui", "resource_icons/food.png");
    resource_icon.scaleX = 0.5;
    resource_icon.scaleY = 0.5;
    resource_icon.setOrigin(0.5, 0.9);
    this.add(resource_icon);

    this.resource_text = resource_text;
    this.resource_icon = resource_icon;

    /* START-USER-CTR-CODE */
    this.player = getPlayer(scene, getCurrentPlayerNumber(scene));
    this.listenToResourceChanged();
    this.scene.events.once(Phaser.Scenes.Events.CREATE, this.init);
    /* END-USER-CTR-CODE */
  }

  private resource_text: Phaser.GameObjects.Text;
  public resource_icon: Phaser.GameObjects.Image;
  public type: "wood" | "stone" | "minerals" | "food" | "" = "";

  /* START-USER-CODE */
  private readonly player: ProbableWafflePlayer | undefined;
  private resourceChangedSubscription?: Subscription;

  private init = () => {
    this.assignResourceText();
  };

  private listenToResourceChanged() {
    this.resourceChangedSubscription = listenToResourceChanged(this.scene)?.subscribe(this.assignResourceText);
  }

  private getPlayerResource(): number {
    if (!this.player) return 0;
    const resources = this.player.playerState.data.resources;
    switch (this.type) {
      case "wood":
        return resources.wood;
      case "stone":
        return resources.stone;
      case "minerals":
        return resources.minerals;
      case "food":
        return resources.food;
      default:
        return 0;
    }
  }

  private assignResourceText = () => {
    this.resource_text.text = this.getPlayerResource().toString();
  };

  destroy(fromScene?: boolean) {
    super.destroy(fromScene);
    this.resourceChangedSubscription?.unsubscribe();
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
