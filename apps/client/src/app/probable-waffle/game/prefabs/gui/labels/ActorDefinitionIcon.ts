// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class ActorDefinitionIcon extends Phaser.GameObjects.Container {

  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? -0.2614598925078324, y ?? -0.08298458904027939);

    // text_1
    const text_1 = scene.add.text(21.261459892507833, 11.082984589831902, "", {});
    text_1.setOrigin(0, 0.5);
    text_1.text = "New text";
    text_1.setStyle({ "fontFamily": "ARCADECLASSIC", "fontSize": "12px", "resolution": 10 });
    this.add(text_1);

    // character_icons_general_warrior_png
    const character_icons_general_warrior_png = scene.add.image(11.261459892507833, 20.082984589831902, "factions", "character_icons/general/warrior.png");
    character_icons_general_warrior_png.scaleX = 0.35151337898441726;
    character_icons_general_warrior_png.scaleY = 0.35151337898441726;
    character_icons_general_warrior_png.setOrigin(0.5, 0.9);
    this.add(character_icons_general_warrior_png);

    this.text_1 = text_1;
    this.character_icons_general_warrior_png = character_icons_general_warrior_png;

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  public text_1: Phaser.GameObjects.Text;
  public character_icons_general_warrior_png: Phaser.GameObjects.Image;

  /* START-USER-CODE */

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
