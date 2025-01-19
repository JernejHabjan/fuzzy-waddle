// You can write more code here

/* START OF COMPILED CODE */

import ActorDefinitionIcon from "./ActorDefinitionIcon";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class ActorDefinitionTooltip extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 30, y ?? 70);

    // game_actions_bg
    const game_actions_bg = scene.add.nineslice(
      -29,
      -67,
      "gui",
      "cryos_mini_gui/surfaces/surface_dark.png",
      20,
      20,
      1,
      1,
      1,
      1
    );
    game_actions_bg.scaleX = 12.430939264477326;
    game_actions_bg.scaleY = 10.778213319031138;
    game_actions_bg.setOrigin(0, 0);
    this.add(game_actions_bg);

    // icon
    const icon = scene.add.image(100, 0, "factions", "character_icons/general/warrior.png");
    icon.setOrigin(0.5, 0.9);
    this.add(icon);

    // title
    const title = scene.add.text(100, 17, "", {});
    title.setOrigin(0.5, 0);
    title.text = "Actor name";
    title.setStyle({ align: "center", maxLines: 2 });
    title.setWordWrapWidth(250);
    this.add(title);

    // description
    const description = scene.add.text(100, 47, "", {});
    description.setOrigin(0.5, 0);
    description.text = "Actual description of this actor";
    description.setStyle({ align: "center" });
    description.setWordWrapWidth(200);
    this.add(description);

    // actorDefinitionIcon
    const actorDefinitionIcon = new ActorDefinitionIcon(scene, 48, 85);
    this.add(actorDefinitionIcon);

    // actorDefinitionIcon_1
    const actorDefinitionIcon_1 = new ActorDefinitionIcon(scene, 47, 108);
    this.add(actorDefinitionIcon_1);

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
    this.icon.setTexture(tooltipInfo.iconKey, tooltipInfo.iconFrame);
    this.title.setText(tooltipInfo.title);
    this.description.setText(tooltipInfo.description);
  }
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */
export type TooltipInfo = {
  iconKey: string;
  iconFrame: string;
  title: string;
  description: string;
};
// You can write more code here
