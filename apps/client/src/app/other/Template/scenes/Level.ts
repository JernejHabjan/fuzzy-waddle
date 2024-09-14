// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
import MovingPlatform1 from "../prefabs/MovingPlatform1";
import Ladder from "../prefabs/Ladder";
import Player from "../prefabs/Player";
import FoodItem from "../prefabs/FoodItem";
import PlayerButton from "../prefabs/PlayerButton";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class Level extends Phaser.Scene {
  constructor() {
    super("Level");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  editorCreate(): void {
    // backgroundLayer
    const backgroundLayer = this.add.layer();

    // background
    const background = this.add.image(0, 1, "Volcano Level Set_Background - Layer 00");
    background.scaleX = 1.1;
    background.scaleY = 1.1;
    background.setOrigin(0, 0);
    background.tintTopLeft = 16777215;
    background.tintTopRight = 16777215;
    background.tintBottomLeft = 16777215;
    background.tintBottomRight = 16777215;
    backgroundLayer.add(background);

    // platformBottomItemsLayer
    const platformBottomItemsLayer = this.add.layer();

    // signpost1
    const signpost1 = this.add.image(1536, -344, "volcano", "Volcano Level Set_Environment - Signpost 01.png");
    platformBottomItemsLayer.add(signpost1);

    // platformsLayer
    const platformsLayer = this.add.layer();

    // movingPlatform2
    const movingPlatform2 = new MovingPlatform1(this, 890, 256);
    platformsLayer.add(movingPlatform2);

    // platformTopItemsLayer
    const platformTopItemsLayer = this.add.layer();

    // endFlag
    const endFlag = this.add.image(2944, 526, "volcano", "Volcano Level Set_Environment - White Flag.png");
    platformTopItemsLayer.add(endFlag);

    // signpost
    const signpost = this.add.image(131, 519, "volcano", "Volcano Level Set_Environment - Signpost 01.png");
    platformTopItemsLayer.add(signpost);

    // skull1
    const skull1 = this.add.image(2093, -28, "volcano", "Volcano Level Set_Environment - Skull.png");
    platformTopItemsLayer.add(skull1);

    // laddersLayer
    const laddersLayer = this.add.layer();

    // ladder5
    const ladder5 = new Ladder(this, 1468, -150, "volcano", "Volcano Level Set_Platformer - Ladder.png");
    laddersLayer.add(ladder5);

    // ladder4
    const ladder4 = new Ladder(this, 1472, -272, "volcano", "Volcano Level Set_Platformer - Ladder.png");
    laddersLayer.add(ladder4);

    // ladder3
    const ladder3 = new Ladder(this, 1475, -22, "volcano", "Volcano Level Set_Platformer - Ladder.png");
    laddersLayer.add(ladder3);

    // ladder2
    const ladder2 = new Ladder(this, 1467, 106, "volcano", "Volcano Level Set_Platformer - Ladder.png");
    laddersLayer.add(ladder2);

    // ladder1
    const ladder1 = new Ladder(this, 1475, 208);
    laddersLayer.add(ladder1);

    // ladder6
    const ladder6 = new Ladder(this, 952, 321);
    laddersLayer.add(ladder6);

    // playerLayer
    const playerLayer = this.add.layer();

    // player
    const player = new Player(this, 104, 482, "player", "Idle_001");
    playerLayer.add(player);

    // pickItemsLayer
    const pickItemsLayer = this.add.layer();

    // meet3
    const meet3 = new FoodItem(this, 1232, 33, "volcano", "Volcano Level Set_Collectable Object - Meat.png");
    pickItemsLayer.add(meet3);

    // meet2
    const meet2 = new FoodItem(this, 2250, 278, "volcano", "Volcano Level Set_Collectable Object - Meat.png");
    pickItemsLayer.add(meet2);

    // meet1
    const meet1 = new FoodItem(this, 747, 386);
    pickItemsLayer.add(meet1);

    // controlsLayer
    this.add.layer();

    // btn_left
    const btn_left = new PlayerButton(this);
    this.add.existing(btn_left);

    // btn_right
    const btn_right = new PlayerButton(this);
    this.add.existing(btn_right);

    // btn_up
    const btn_up = new PlayerButton(this);
    this.add.existing(btn_up);

    // debugLayer
    this.add.layer();

    // lists
    const platforms = [movingPlatform2, ladder1, ladder2, ladder3, ladder5, ladder4, ladder6];
    const foodItems = [meet1, meet3, meet2];

    // player (prefab fields)
    player.platforms = platforms;
    player.foodItems = foodItems;

    this.player = player;

    this.events.emit("scene-awake");
  }

  private player!: Player;

  /* START-USER-CODE */

  create() {
    this.editorCreate();

    this.cameras.main.setBounds(0, -800, 3000, 750 + 800);
    this.cameras.main.startFollow(this.player);
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
