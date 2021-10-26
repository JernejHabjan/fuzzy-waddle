import { Scenes } from "../scenes";
import { CreateSceneFromObjectConfig } from "../../phaser/phaser";
import Phaser from "phaser";
import { AssetsFirst } from "./assets";

export default class MainSceneFirst extends Phaser.Scene implements CreateSceneFromObjectConfig {
  player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  stars: Phaser.Physics.Arcade.Group;
  bombs: Phaser.Physics.Arcade.Group;
  platforms: Phaser.Physics.Arcade.StaticGroup;
  cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  score = 0;
  gameOver = false;
  scoreText: Phaser.GameObjects.Text;

  constructor() {
    super({ key: Scenes.MainSceneFirst });
  }

  preload() {
    this.load
      .image(AssetsFirst.sky, "assets/firstgame/sky.png")
      .image(AssetsFirst.ground, "assets/firstgame/platform.png")
      .image(AssetsFirst.star, "assets/firstgame/star.png")
      .image(AssetsFirst.bomb, "assets/firstgame/bomb.png")
      .spritesheet(AssetsFirst.dude, "assets/firstgame/dude.png", { frameWidth: 32, frameHeight: 48 });
  }

  create() {
    //  A simple background for our game
    this.add.image(400, 300, AssetsFirst.sky);

    //  The platforms group contains the ground and the 2 ledges we can jump on
    this.platforms = this.physics.add.staticGroup();

    //  Here we create the ground.
    //  Scale it to fit the width of the game (the original sprite is 400x32 in size)
    this.platforms.create(400, 568, AssetsFirst.ground).setScale(2).refreshBody();

    //  Now let's create some ledges
    this.platforms.create(600, 400, AssetsFirst.ground);
    this.platforms.create(50, 250, AssetsFirst.ground);
    this.platforms.create(750, 220, AssetsFirst.ground);

    // The player and its settings
    this.player = this.physics.add.sprite(100, 450, AssetsFirst.dude);

    //  Player physics properties. Give the little guy a slight bounce.
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);

    //  Our player animations, turning, walking left and walking right.
    this.anims.create({
      key: "left",
      frames: this.anims.generateFrameNumbers(AssetsFirst.dude, { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
      key: "turn",
      frames: [{ key: AssetsFirst.dude, frame: 4 }],
      frameRate: 20
    });

    this.anims.create({
      key: "right",
      frames: this.anims.generateFrameNumbers(AssetsFirst.dude, { start: 5, end: 8 }),
      frameRate: 10,
      repeat: -1
    });

    //  Input Events
    this.cursors = this.input.keyboard.createCursorKeys();

    //  Some stars to collect, 12 in total, evenly spaced 70 pixels apart along the x axis
    this.stars = this.physics.add.group({
      key: AssetsFirst.star,
      repeat: 11,
      setXY: { x: 12, y: 0, stepX: 70 }
    });

    this.stars.children.iterate((child) => {
      //  Give each star a slightly different bounce
      const sprite = child as Phaser.Physics.Arcade.Sprite;
      sprite.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    });

    this.bombs = this.physics.add.group();

    //  The score
    this.scoreText = this.add.text(16, 16, "score: 0", { fontSize: "32px", color: "black" });

    //  Collide the player and the stars with the platforms
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.stars, this.platforms);
    this.physics.add.collider(this.bombs, this.platforms);

    //  Checks to see if the player overlaps with any of the stars, if he does call the collectStar function
    this.physics.add.overlap(this.player, this.stars, (player, star) =>
      this.collectStar(player as Phaser.Physics.Arcade.Sprite, star as Phaser.Physics.Arcade.Sprite)
    );

    this.physics.add.collider(this.player, this.bombs, (player, bomb) =>
      this.hitBomb(player as Phaser.Physics.Arcade.Sprite, bomb as Phaser.Physics.Arcade.Sprite)
    );
  }

  update() {
    if (this.gameOver) {
      return;
    }

    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-400);

      this.player.anims.play("left", true);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(400);

      this.player.anims.play("right", true);
    } else {
      this.player.setVelocityX(0);

      this.player.anims.play("turn");
    }

    if (this.cursors.up.isDown && this.player.body.touching.down) {
      this.player.setVelocityY(-330);
    }
  }

  collectStar(player: Phaser.Physics.Arcade.Sprite, star: Phaser.Physics.Arcade.Sprite) {
    star.disableBody(true, true);

    //  Add and update the score
    this.score += 10;
    this.scoreText.setText("Score: " + this.score);

    if (this.stars.countActive(true) === 0) {
      //  A new batch of stars to collect
      this.stars.children.iterate((child) => {
        const sprite = child as Phaser.Physics.Arcade.Sprite;
        sprite.enableBody(true, sprite.x, 0, true, true);
      });

      const x = player.x < 400 ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);

      const bomb: Phaser.Physics.Arcade.Sprite = this.bombs.create(x, 16, AssetsFirst.bomb);
      bomb.setBounce(1);
      bomb.setCollideWorldBounds(true);
      bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
    }
  }

  // noinspection JSUnusedLocalSymbols
  hitBomb(player: Phaser.Physics.Arcade.Sprite, bomb: Phaser.Physics.Arcade.Sprite) {
    this.physics.pause();

    player.setTint(0xff0000);

    player.anims.play("turn");

    this.gameOver = true;
  }
}
