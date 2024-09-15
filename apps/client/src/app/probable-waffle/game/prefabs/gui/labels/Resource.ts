// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
import { emitResource, getCurrentPlayerNumber, getPlayer, listenToResourceChanged } from "../../../data/scene-data";
import { Subscription } from "rxjs";
import { PlayerStateResources, ProbableWafflePlayer, ResourceType } from "@fuzzy-waddle/api-interfaces";
/* END-USER-IMPORTS */

export default class Resource extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 71.80414581298828, y ?? 32.202178808720916);

    // resource_text
    const resource_text = scene.add.text(-39, -20, "", {});
    resource_text.text = "0";
    this.add(resource_text);

    // resource_icon
    const resource_icon = scene.add.image(-56, -4, "factions", "character_icons/general/warrior.png");
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
  public type: "wood" | "stone" | "minerals" | "" = "";

  /* START-USER-CODE */
  private readonly player: ProbableWafflePlayer | undefined;
  private resourceChangedSubscription?: Subscription;

  private init = () => {
    this.assignResourceText();
    this.testEmitResource();
  };

  private listenToResourceChanged() {
    this.resourceChangedSubscription = listenToResourceChanged(this.scene)?.subscribe(this.assignResourceText);
  }

  private testEmitResource() {
    setTimeout(() => {
      emitResource(this.scene, "resource.added", {
        [ResourceType.Wood]: 100
      } satisfies Partial<PlayerStateResources>);
      console.log("resources added for test");
    }, 1000);
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
