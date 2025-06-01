import { AssetsDungeon, DungeonTilesetLayers, DungeonTilesetNames } from "../assets";
import { createLizardAnims } from "../anims/EnemyAnims";
import { createCharacterAnims } from "../anims/CharacterAnims";
import Lizard from "../enemies/Lizard";
import "../characters/Faune";
import Faune from "../characters/Faune";
import { createTreasureAnims } from "../anims/TreasureAnims";
import { DungeonCrawlerScenes } from "../dungeonCrawlerScenes";
import { CreateSceneFromObjectConfig } from "../../../shared/game/phaser/scene/scene-config.interface";
import Phaser, { Scene } from "phaser";
import VirtualJoystickPlugin from "phaser3-rex-plugins/plugins/virtualjoystick-plugin.js";
import TilemapLayer = Phaser.Tilemaps.TilemapLayer;

export default class Dungeon extends Scene implements CreateSceneFromObjectConfig {
  private readonly DEBUG = false;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private faune!: Faune;
  private playerLizardsCollider?: Phaser.Physics.Arcade.Collider;
  private knives!: Phaser.Physics.Arcade.Group;
  private lizards!: Phaser.Physics.Arcade.Group;
  private joystick?: any;
  private joystickRight?: any;
  private wasd?: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private isMobile = false;
  private activePointer?: Phaser.Input.Pointer;
  private victoryText?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: DungeonCrawlerScenes.MainSceneDungeon });
  }

  preload() {
    this.cursors = this.input.keyboard?.createCursorKeys();
    // Detect mobile
    this.isMobile = this.sys.game.device.os.android || this.sys.game.device.os.iOS;
    // Always create cursors for Faune.update signature
    this.cursors = this.input.keyboard?.createCursorKeys();
  }

  create() {
    // add gui
    this.scene.run(DungeonCrawlerScenes.DungeonUi);

    createLizardAnims(this.anims);
    createCharacterAnims(this.anims);
    createTreasureAnims(this.anims);

    const map = this.make.tilemap({ key: AssetsDungeon.dungeon });
    const tileset = map.addTilesetImage(DungeonTilesetNames.dungeon, AssetsDungeon.tiles)!;
    const groundLayer = map.createLayer(DungeonTilesetLayers.Ground, tileset) as TilemapLayer;
    const wallsLayer = map.createLayer(DungeonTilesetLayers.Walls, tileset) as TilemapLayer;
    const assetsLayer = map.createLayer(DungeonTilesetLayers.Assets, tileset) as TilemapLayer;

    wallsLayer.setCollisionByProperty({ collides: true });
    assetsLayer.setCollisionByProperty({ collides: true });

    this.renderDebugCollision(wallsLayer);
    this.renderDebugCollision(assetsLayer);

    this.knives = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Image
    });

    this.faune = this.add.faune(100, 128);
    this.faune.setKnives(this.knives);

    this.lizards = this.physics.add.group({
      classType: Lizard,
      createCallback: (go) => (go as Lizard).createCallback()
    });

    this.lizards.get(256, 80);
    this.lizards.get(256, 128);

    this.physics.add.collider(this.faune, wallsLayer);
    this.physics.add.collider(this.lizards, wallsLayer);
    this.physics.add.collider(this.knives, wallsLayer, this.handleKnifeWallCollision, undefined, this);
    this.physics.add.collider(this.faune, assetsLayer);
    this.physics.add.collider(this.lizards, assetsLayer);
    this.physics.add.collider(this.knives, assetsLayer);
    this.physics.add.collider(this.knives, this.lizards, this.handleKnifeLizardCollision, undefined, this);
    this.playerLizardsCollider = this.physics.add.collider(
      this.lizards,
      this.faune,
      this.handlePlayerLizardCollision,
      undefined,
      this
    );

    this.cameras.main.startFollow(this.faune, true);

    // Setup controls
    if (this.isMobile) {
      this.input.addPointer(2);

      const margin = 40;
      const leftJoystickRadius = 30;
      const rightJoystickRadius = 20;
      // Virtual joystick (left for movement, right for action)
      this.joystick = (this.plugins.get("rexVirtualJoystick") as VirtualJoystickPlugin).add(this, {
        x: margin,
        y: this.cameras.main.height - margin,
        radius: leftJoystickRadius,
        base: this.add.circle(0, 0, leftJoystickRadius, 0x888888, 0.3),
        thumb: this.add.circle(0, 0, leftJoystickRadius / 2, 0xcccccc, 0.7),
        dir: "8dir",
        forceMin: 10,
        enable: true
      });

      this.joystickRight = (this.plugins.get("rexVirtualJoystick") as VirtualJoystickPlugin).add(this, {
        x: this.cameras.main.width - margin,
        y: this.cameras.main.height - margin,
        radius: rightJoystickRadius,
        base: this.add.circle(0, 0, rightJoystickRadius, 0x888888, 0.3),
        thumb: this.add.circle(0, 0, rightJoystickRadius / 2, 0xcccccc, 0.7),
        dir: "8dir",
        forceMin: 10,
        enable: true
      });
    } else {
      // WASD keys for desktop
      this.wasd = {
        up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D)
      };

      // Fire projectile in direction of click
      this.input.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
        const dx = pointer.worldX - this.faune.x;
        const dy = pointer.worldY - this.faune.y;
        const angle = Phaser.Math.RadToDeg(Math.atan2(dy, dx));
        // Use knife cooldown for click as well
        const t = this.time.now;
        if (t - this.faune.lastKnifeTime > this.faune.knifeCooldown) {
          this.faune.throwKnife(angle);
          this.faune.lastKnifeTime = t;
        }
      });

      this.input.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
        this.activePointer = pointer;
      });

      this.input.on(Phaser.Input.Events.POINTER_UP, () => {
        this.activePointer = undefined;
      });
    }

    // remember to clean up on Scene shutdown
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off(Phaser.Input.Events.POINTER_UP);
      this.input.off(Phaser.Input.Events.POINTER_DOWN);
    });
  }

  /**
   * Update speed by delta
   */
  update(t: number, dt: number) {
    if (!this.faune) return;
    if (this.isMobile) {
      const joystick = this.joystick;
      const joystickRight = this.joystickRight;
      this.faune.update(this.cursors!, t, dt, joystick, joystickRight);
    } else {
      this.faune.updateWASD(this.wasd!, t, dt);
    }

    // Handle held pointer shooting
    if (this.activePointer?.isDown) {
      const dx = this.activePointer.worldX - this.faune.x;
      const dy = this.activePointer.worldY - this.faune.y;
      const angle = Phaser.Math.RadToDeg(Math.atan2(dy, dx));

      const now = this.time.now;
      if (now - this.faune.lastKnifeTime > this.faune.knifeCooldown) {
        this.faune.throwKnife(angle);
        this.faune.lastKnifeTime = now;
      }
    }
  }

  renderDebugCollision(layer: Phaser.Tilemaps.TilemapLayer | Phaser.Tilemaps.TilemapGPULayer) {
    if (!this.DEBUG) return;
    const debugGraphics = this.add.graphics().setAlpha(0.7);
    layer.renderDebug(debugGraphics, {
      tileColor: null, // colour of non-colliding tiles
      collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // colour of colliding tiles
      faceColor: new Phaser.Display.Color(40, 39, 37, 255) // colour of colliding face edges
    });
  }

  private handleKnifeWallCollision(knife: any, _obj2: any) {
    this.knives.killAndHide(knife);
    // Remove from collision as this one still exists
    this.knives.remove(knife, true, true);
  }

  private handleKnifeLizardCollision(knife: any, lizard: any) {
    this.knives.killAndHide(knife);
    this.lizards.killAndHide(lizard);

    // Remove both from collision as this one still exists
    this.knives.remove(knife, true, true);
    this.lizards.remove(lizard, true, true);

    // Check if all lizards are dead
    if (this.lizards.countActive(true) === 0) {
      this.onAllLizardsKilled();
    }
  }

  private onAllLizardsKilled() {
    // Pause the game and display "Victory"
    this.victoryText = this.add
      .text(this.cameras.main.centerX, this.cameras.main.centerY, "Victory", {
        fontSize: "12px",
        color: "#fff",
        backgroundColor: "#222",
        padding: { x: 20, y: 10 },
        wordWrap: {
          width: this.cameras.main.width - 40
        }
      })
      .setOrigin(0.5);
    this.victoryText.setScrollFactor(0); // Make sure it doesn't scroll with the camera

    // Listen for any input to restart the scene
    const restartScene = () => {
      this.input.keyboard?.off("keydown", restartScene);
      this.input.off("pointerdown", restartScene);
      this.input.off("gamepaddown", restartScene);
      this.victoryText?.destroy();
      this.scene.restart();
    };

    setTimeout(() => {
      if (!this.victoryText) return; // If victory text was destroyed, do not add listeners
      // set Victory text to "click to restart"
      this.victoryText.setText("Click or press any key to restart");
      this.input.keyboard?.on("keydown", restartScene);
      this.input.on("pointerdown", restartScene);
      this.input.on("gamepaddown", restartScene);
    }, 1000);
  }

  private handlePlayerLizardCollision(_obj1: any, obj2: any) {
    const lizard = obj2 as Lizard;
    const dx = this.faune.x - lizard.x;
    const dy = this.faune.y - lizard.y;

    const dir = new Phaser.Math.Vector2(dx, dy).normalize().scale(200);
    this.faune.handleDamage(dir);

    if (this.faune.health <= 0) {
      // Stop the collider so Faune isn't hit multiple times after death
      this.physics.world.removeCollider(this.playerLizardsCollider!);

      this.faune.setTint(0xff0000);
      this.faune.anims.stop();
      this.faune.setVelocity(0, 0);

      const gameOverText = this.add
        .text(this.cameras.main.centerX, this.cameras.main.centerY, "Game Over", {
          fontSize: "12px",
          color: "#fff",
          backgroundColor: "#222",
          padding: { x: 20, y: 10 },
          wordWrap: {
            width: this.cameras.main.width - 40
          }
        })
        .setOrigin(0.5);
      gameOverText.setScrollFactor(0);

      const restartScene = () => {
        this.input.keyboard?.off("keydown", restartScene);
        this.input.off("pointerdown", restartScene);
        this.input.off("gamepaddown", restartScene);
        gameOverText.destroy();
        this.scene.restart();
      };

      setTimeout(() => {
        if (!gameOverText) return;
        gameOverText.setText("Click or press any key to restart");
        this.input.keyboard?.on("keydown", restartScene);
        this.input.on("pointerdown", restartScene);
        this.input.on("gamepaddown", restartScene);
      }, 1000);
    }
  }
}
