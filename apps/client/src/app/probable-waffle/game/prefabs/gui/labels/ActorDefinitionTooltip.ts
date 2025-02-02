// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { IconHelper } from "./IconHelper";
import { Vector2Simple } from "@fuzzy-waddle/api-interfaces";
/* END-USER-IMPORTS */

export default class ActorDefinitionTooltip extends Phaser.GameObjects.Container {

  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 0, y ?? 0);

    // game_actions_bg
    const game_actions_bg = scene.add.nineslice(1, 0, "gui", "cryos_mini_gui/surfaces/surface_dark.png", 20, 20, 1, 1, 1, 1);
    game_actions_bg.scaleX = 12.430939264477326;
    game_actions_bg.scaleY = 10.778213319031138;
    game_actions_bg.setOrigin(0, 0);
    this.add(game_actions_bg);

    // icon
    const icon = scene.add.image(131, 49, "factions", "character_icons/general/warrior.png");
    this.add(icon);

    // title
    const title = scene.add.text(129, 95, "", {});
    title.setOrigin(0.5, 0);
    title.text = "Actor name";
    title.setStyle({ "align": "center", "fontSize": "20px", "maxLines": 2, "resolution": 4 });
    title.setWordWrapWidth(250);
    this.add(title);

    // description
    const description = scene.add.text(130, 124, "", {});
    description.setOrigin(0.5, 0);
    description.text = "Actual description of this actor";
    description.setStyle({ "align": "center", "resolution": 4 });
    description.setWordWrapWidth(200);
    this.add(description);

    this.icon = icon;
    this.title = title;
    this.description = description;

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  private icon: Phaser.GameObjects.Image;
  private title: Phaser.GameObjects.Text;
  private description: Phaser.GameObjects.Text;

  /* START-USER-CODE */
  setup(tooltipInfo: TooltipInfo) {
    const tooltipIconSize = 64;
    IconHelper.setIcon(this.icon, tooltipInfo.iconKey, tooltipInfo.iconFrame, tooltipInfo.iconOrigin, {
      maxWidth: tooltipIconSize,
      maxHeight: tooltipIconSize
    });
    this.title.setText(tooltipInfo.title);
    this.description.setText(tooltipInfo.description);
  }
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */
export type TooltipInfo = {
  iconKey: string;
  iconFrame: string;
  iconOrigin: Vector2Simple;
  title: string;
  description: string;
};
// You can write more code here
