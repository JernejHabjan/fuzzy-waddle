import Phaser from "phaser";
import GameProbableWaffleScene from "../GameProbableWaffleScene";
import Spawn from "../../../prefabs/buildings/misc/Spawn";
import EditorOwner from "../editor-components/EditorOwner";
import Tree6 from "../../../prefabs/outside/foliage/trees/resources/Tree6";
import StonePile from "../../../prefabs/outside/resources/stone-pile/StonePile";
import Minerals from "../../../prefabs/outside/resources/minerals/Minerals";

/** Frozen, campaign-free topology for targeted skirmish economy and production cases. */
export default class MapAiOpenEconomy extends GameProbableWaffleScene {
  public override tilemap!: Phaser.Tilemaps.Tilemap;

  constructor(sceneKey = "MapAiOpenEconomy", private readonly thirdSpawn = false) {
    super(sceneKey);
  }

  editorCreate(): void {
    const tilemap = this.add.tilemap("tiles_ai_open_economy");
    tilemap.addTilesetImage("tiles", "tiles_1");
    tilemap.createLayer("TileMap_level_1", ["tiles"], 0, 0);

    const westSpawn = new Spawn(this, -848, 576);
    this.add.existing(westSpawn);
    const westOwner = new EditorOwner(westSpawn);
    westOwner.owner_id = "1";

    const eastSpawn = new Spawn(this, 464, 848);
    this.add.existing(eastSpawn);
    const eastOwner = new EditorOwner(eastSpawn);
    eastOwner.owner_id = "2";

    if (this.thirdSpawn) {
      const southSpawn = new Spawn(this, -176, 1264);
      this.add.existing(southSpawn);
      const southOwner = new EditorOwner(southSpawn);
      southOwner.owner_id = "3";
      this.add.existing(new Tree6(this, -336, 1312));
      this.add.existing(new StonePile(this, -64, 1392));
      this.add.existing(new Minerals(this, -384, 1168));
    }

    for (const [x, y] of [[-672, 640], [-960, 736], [288, 752], [608, 928]]) {
      this.add.existing(new Tree6(this, x, y));
    }
    for (const [x, y] of [[-688, 784], [272, 960]]) {
      this.add.existing(new StonePile(this, x, y));
    }
    for (const [x, y] of [[-992, 608], [752, 784]]) {
      this.add.existing(new Minerals(this, x, y));
    }

    this.tilemap = tilemap;
    this.events.emit("scene-awake");
  }

  override create(): void {
    this.editorCreate();
    super.create();
  }
}
