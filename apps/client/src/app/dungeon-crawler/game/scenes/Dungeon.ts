import { AssetsDungeon, DungeonTilesetLayers, DungeonTilesetNames } from "../assets";
import { createLizardAnims } from "../anims/EnemyAnims";
import { createCharacterAnims } from "../anims/CharacterAnims";
import Lizard from "../enemies/Lizard";
import "../characters/Faune";
import Faune from "../characters/Faune";
import { createTreasureAnims } from "../anims/TreasureAnims";
import { DungeonCrawlerScenes } from "../dungeonCrawlerScenes";
import { CreateSceneFromObjectConfig } from "../../../shared/game/phaser/scene/scene-config.interface";
import { Scene } from "phaser";

export default class Dungeon extends Scene implements CreateSceneFromObjectConfig {
  private readonly DEBUG = false;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private faune!: Faune;
  private playerLizardsCollider?: Phaser.Physics.Arcade.Collider;
  private knives!: Phaser.Physics.Arcade.Group;
  private lizards!: Phaser.Physics.Arcade.Group;

  constructor() {
    super({ key: DungeonCrawlerScenes.MainSceneDungeon });
  }

  preload() {
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
    const groundLayer = map.createLayer(DungeonTilesetLayers.Ground, tileset);
    const wallsLayer = map.createLayer(DungeonTilesetLayers.Walls, tileset)!;
    const assetsLayer = map.createLayer(DungeonTilesetLayers.Assets, tileset)!;

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

    // remember to clean up on Scene shutdown
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off(Phaser.Input.Events.POINTER_UP);
    });
  }

  /**
   * Update speed by delta
   */
  update(t: number, dt: number) {
    if (this.faune && this.cursors) {
      // Pass delta time to faune's update for frame-rate independent movement
      this.faune.update(this.cursors, t, dt);
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
  }

  private handlePlayerLizardCollision(_obj1: any, obj2: any) {
    const lizard = obj2 as Lizard;
    const dx = this.faune.x - lizard.x;
    const dy = this.faune.y - lizard.y;

    const dir = new Phaser.Math.Vector2(dx, dy).normalize().scale(200);
    this.faune.handleDamage(dir);

    if (this.faune.health <= 0) {
      // stop colliding after death
      this.playerLizardsCollider?.destroy();
    }
  }
}
