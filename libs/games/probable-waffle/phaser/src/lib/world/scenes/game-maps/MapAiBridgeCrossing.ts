import GameProbableWaffleScene from "../GameProbableWaffleScene";
import { getPlayersFromScene } from "@fuzzy-waddle/platform-game-host/phaser/scene/base.scene";
import { FactionType, type ProbableWafflePlayer } from "@fuzzy-waddle/probable-waffle-protocol";
import AnkGuard from "../../../prefabs/buildings/tivara/AnkGuard";
import Temple from "../../../prefabs/buildings/tivara/Temple";
import InfantryInn from "../../../prefabs/buildings/skaduwee/InfantryInn";
import Owlery from "../../../prefabs/buildings/skaduwee/Owlery";
import Spawn from "../../../prefabs/buildings/misc/Spawn";
import EditorOwner from "../editor-components/EditorOwner";
import BlockStone1 from "../../../prefabs/outside/nature/block_stone/BlockStone1";
import BlockStone2 from "../../../prefabs/outside/nature/block_stone/BlockStone2";
import BlockStoneTopRightBottomRight from "../../../prefabs/outside/nature/block_stone_grass/BlockStoneTopRightBottomRight";
import BlockStoneWater1 from "../../../prefabs/outside/nature/block_stone_water/BlockStoneWater1";
import BlockStoneWater3 from "../../../prefabs/outside/nature/block_stone_water/BlockStoneWater3";
import BlockStoneWater4 from "../../../prefabs/outside/nature/block_stone_water/BlockStoneWater4";
import BridgeStone from "../../../prefabs/outside/architecture/river/BridgeStone";
import BushDownwardsLarge from "../../../prefabs/outside/foliage/bushes/BushDownwardsLarge";
import BushDownwardsSmall from "../../../prefabs/outside/foliage/bushes/BushDownwardsSmall";
import BushDry from "../../../prefabs/outside/foliage/bushes/BushDry";
import BushUpwardsSmall from "../../../prefabs/outside/foliage/bushes/BushUpwardsSmall";
import ChristmasTree from "../../../prefabs/outside/foliage/trees/resources/special/ChristmasTree";
import FenceBottom from "../../../prefabs/outside/architecture/obstruction/FenceBottom";
import FenceBottomLeft from "../../../prefabs/outside/architecture/obstruction/FenceBottomLeft";
import FenceBottomRight from "../../../prefabs/outside/architecture/obstruction/FenceBottomRight";
import FenceLeftCorner from "../../../prefabs/outside/architecture/obstruction/FenceLeftCorner";
import FenceRightCorner from "../../../prefabs/outside/architecture/obstruction/FenceRightCorner";
import FenceTop from "../../../prefabs/outside/architecture/obstruction/FenceTop";
import FenceTopLeft from "../../../prefabs/outside/architecture/obstruction/FenceTopLeft";
import FenceTopRight from "../../../prefabs/outside/architecture/obstruction/FenceTopRight";
import Minerals from "../../../prefabs/outside/resources/minerals/Minerals";
import RampStoneTopRight from "../../../prefabs/outside/nature/ramp/stone/RampStoneTopRight";
import Reeds1 from "../../../prefabs/outside/nature/grass/Reeds1";
import RockPiles2 from "../../../prefabs/outside/nature/rock_piles/RockPiles2";
import RockPiles3 from "../../../prefabs/outside/nature/rock_piles/RockPiles3";
import RockPiles5 from "../../../prefabs/outside/nature/rock_piles/RockPiles5";
import StonePile from "../../../prefabs/outside/resources/stone-pile/StonePile";
import TallGrass0 from "../../../prefabs/outside/foliage/tall_grass/TallGrass0";
import TallGrass1 from "../../../prefabs/outside/foliage/tall_grass/TallGrass1";
import TallGrass2 from "../../../prefabs/outside/foliage/tall_grass/TallGrass2";
import TallGrass3 from "../../../prefabs/outside/foliage/tall_grass/TallGrass3";
import TallGrass4 from "../../../prefabs/outside/foliage/tall_grass/TallGrass4";
import TallGrass5 from "../../../prefabs/outside/foliage/tall_grass/TallGrass5";
import TallGrass6 from "../../../prefabs/outside/foliage/tall_grass/TallGrass6";
import TallGrass7 from "../../../prefabs/outside/foliage/tall_grass/TallGrass7";
import Tree1 from "../../../prefabs/outside/foliage/trees/resources/Tree1";
import Tree10 from "../../../prefabs/outside/foliage/trees/resources/Tree10";
import Tree11 from "../../../prefabs/outside/foliage/trees/resources/Tree11";
import Tree4 from "../../../prefabs/outside/foliage/trees/resources/Tree4";
import Tree5 from "../../../prefabs/outside/foliage/trees/resources/Tree5";
import Tree6 from "../../../prefabs/outside/foliage/trees/resources/Tree6";
import Tree7 from "../../../prefabs/outside/foliage/trees/resources/Tree7";
import Tree9 from "../../../prefabs/outside/foliage/trees/resources/Tree9";
import TreeTrunk from "../../../prefabs/outside/foliage/tree_trunks/TreeTrunk";
import UndeadLandDeadTreeAnim1 from "../../../prefabs/outside/environment/undead_land/UndeadLandDeadTreeAnim1";
import UndeadLandDeadTreeAnim2 from "../../../prefabs/outside/environment/undead_land/UndeadLandDeadTreeAnim2";
import UndeadLandDeadTreeAnim3 from "../../../prefabs/outside/environment/undead_land/UndeadLandDeadTreeAnim3";

/** Frozen River Crossing terrain without the product scene's owned showcase/campaign roster. */
export default class MapAiBridgeCrossing extends GameProbableWaffleScene {
  constructor() {
    super("MapAiBridgeCrossing");
  }

  editorCreate(): void {
    const tilemap = this.add.tilemap("tiles_ai_bridge_crossing");
    tilemap.addTilesetImage("tiles", "tiles_1");
    tilemap.addTilesetImage("tiles_2", "tiles_2");
    tilemap.createLayer("TileMap_level_1", ["tiles", "tiles_2"], 0, 0);
    const spawn0 = new Spawn(this, 96, 608);
    this.add.existing(spawn0);
    new EditorOwner(spawn0).owner_id = "1";
    const spawn1 = new Spawn(this, 1248, 800);
    this.add.existing(spawn1);
    new EditorOwner(spawn1).owner_id = "2";
    this.createTerrain();
    this.createOpponentProducers();
    this.tilemap = tilemap;
    this.events.emit("scene-awake");
  }

  /** Two authored production sites make the ordinary opponent base require an assembled attack force. */
  private createOpponentProducers(): void {
    const first = this.add.zone(-224, 672, 1, 1);
    const second = this.add.zone(-160, 464, 1, 1);
    const faction = getPlayersFromScene<ProbableWafflePlayer>(this).find((player) => player.playerNumber === 1)
      ?.playerController.data.playerDefinition?.factionType;
    if (faction !== FactionType.Tivara && faction !== FactionType.Skaduwee) {
      throw new Error("ai_bridge_opponent_faction_missing");
    }
    const producers =
      faction === FactionType.Tivara
        ? [new AnkGuard(this, first.x, first.y), new Temple(this, second.x, second.y)]
        : [new InfantryInn(this, first.x, first.y), new Owlery(this, second.x, second.y)];
    for (const producer of producers) {
      this.add.existing(producer);
      new EditorOwner(producer).owner_id = "1";
    }
  }

  /** Retains the editor scene's static navigation geometry and neutral physical resources. */
  private createTerrain(): void {
    this.add.existing(new ChristmasTree(this, -288, 1200));
    this.add.existing(new ChristmasTree(this, -128, 1184));
    this.add.existing(new Tree7(this, 160, 1328));
    this.add.existing(new TallGrass1(this, -144, 832));
    this.add.existing(new BushDownwardsSmall(this, -832, 464));
    this.add.existing(new BushDownwardsLarge(this, -576, 400));
    this.add.existing(new BridgeStone(this, -64, 864));
    this.add.existing(new BlockStone2(this, 0, 32));
    this.add.existing(new BlockStone1(this, 64, 32));
    this.add.existing(new BlockStone1(this, -32, 48));
    this.add.existing(new BlockStone2(this, 32, 48));
    this.add.existing(new BlockStone2(this, 0, 64));
    this.add.existing(new BlockStoneTopRightBottomRight(this, -64, 64));
    this.add.existing(new BlockStone1(this, -32, 80));
    this.add.existing(new TreeTrunk(this, -672, 528));
    this.add.existing(new RampStoneTopRight(this, -64, 80));
    this.add.existing(new BlockStone2(this, 32, -16));
    this.add.existing(new BlockStone2(this, 64, 0));
    this.add.existing(new RockPiles5(this, 64, 160));
    this.add.existing(new BlockStone2(this, 128, 160));
    this.add.existing(new BlockStone2(this, 128, 128));
    this.add.existing(new BlockStone2(this, 128, 96));
    this.add.existing(new BlockStone2(this, 128, 64));
    this.add.existing(new BlockStone2(this, 128, 32));
    this.add.existing(new RockPiles2(this, 160, 176));
    this.add.existing(new RockPiles3(this, 96, 176));
    this.add.existing(new RockPiles2(this, 128, 192));
    this.add.existing(new Tree4(this, 128, 0));
    this.add.existing(new Tree7(this, -736, 400));
    this.add.existing(new Tree6(this, -672, 400));
    this.add.existing(new Tree7(this, -608, 448));
    this.add.existing(new Tree4(this, -832, 864));
    this.add.existing(new Tree1(this, -1152, 800));
    this.add.existing(new Tree4(this, -448, 960));
    this.add.existing(new TreeTrunk(this, -784, 880));
    this.add.existing(new Tree5(this, 448, 1328));
    this.add.existing(new Tree6(this, 40, 1432));
    this.add.existing(new BushDry(this, 768, 1040));
    this.add.existing(new BushDry(this, -1056, 944));
    this.add.existing(new BushDry(this, 416, 800));
    this.add.existing(new BushDry(this, -224, 160));
    this.add.existing(new BushUpwardsSmall(this, -128, 80));
    this.add.existing(new BushDownwardsSmall(this, 224, 1312));
    this.add.existing(new BushUpwardsSmall(this, 32, 1440));
    this.add.existing(new BushDry(this, -1024, 768));
    this.add.existing(new Tree5(this, -704, 480));
    this.add.existing(new BlockStone1(this, 384, 976));
    this.add.existing(new BlockStoneWater1(this, 416, 928));
    this.add.existing(new BlockStoneWater4(this, 384, 944));
    this.add.existing(new BlockStoneWater3(this, 448, 976));
    this.add.existing(new BlockStoneWater4(this, 416, 992));
    this.add.existing(new RockPiles5(this, 352, 992));
    this.add.existing(new Tree7(this, 384, 1328));
    this.add.existing(new Tree6(this, 320, 1392));
    this.add.existing(new Tree7(this, 512, 1328));
    this.add.existing(new Tree5(this, 384, 1376));
    this.add.existing(new Tree7(this, 192, 1456));
    this.add.existing(new Tree7(this, 128, 1520));
    this.add.existing(new Tree5(this, -800, 464));
    this.add.existing(new Tree10(this, 320, 672));
    this.add.existing(new Tree9(this, 352, 512));
    this.add.existing(new Tree11(this, -256, 176));
    this.add.existing(new FenceTop(this, -192, 1184));
    this.add.existing(new FenceTopRight(this, -160, 1200));
    this.add.existing(new FenceTopRight(this, -128, 1216));
    this.add.existing(new FenceTopRight(this, -96, 1232));
    this.add.existing(new FenceTopLeft(this, -224, 1200));
    this.add.existing(new FenceTopLeft(this, -256, 1216));
    this.add.existing(new FenceBottomLeft(this, -256, 1280));
    this.add.existing(new FenceBottomLeft(this, -224, 1296));
    this.add.existing(new FenceBottomLeft(this, -192, 1312));
    this.add.existing(new FenceBottomRight(this, -96, 1296));
    this.add.existing(new FenceBottomRight(this, -128, 1312));
    this.add.existing(new FenceBottom(this, -160, 1328));
    this.add.existing(new StonePile(this, 736, 1200));
    this.add.existing(new StonePile(this, -544, 304));
    this.add.existing(new StonePile(this, -576, 320));
    this.add.existing(new StonePile(this, -544, 336));
    this.add.existing(new StonePile(this, 736, 1168));
    this.add.existing(new StonePile(this, 704, 1184));
    this.add.existing(new Minerals(this, -224, 224));
    this.add.existing(new Minerals(this, -192, 208));
    this.add.existing(new Minerals(this, -192, 240));
    this.add.existing(new Minerals(this, -160, 224));
    this.add.existing(new Minerals(this, -256, 240));
    this.add.existing(new Minerals(this, -224, 256));
    this.add.existing(new TallGrass3(this, -400, 800));
    this.add.existing(new TallGrass7(this, -352, 816));
    this.add.existing(new TallGrass7(this, -320, 832));
    this.add.existing(new TallGrass7(this, -224, 848));
    this.add.existing(new TallGrass1(this, -288, 784));
    this.add.existing(new TallGrass1(this, -320, 768));
    this.add.existing(new TallGrass1(this, -176, 816));
    this.add.existing(new TallGrass2(this, -240, 800));
    this.add.existing(new TallGrass1(this, -208, 800));
    this.add.existing(new TallGrass6(this, -288, 848));
    this.add.existing(new TallGrass4(this, -256, 864));
    this.add.existing(new TallGrass3(this, -352, 752));
    this.add.existing(new TallGrass1(this, 32, 896));
    this.add.existing(new TallGrass0(this, 64, 912));
    this.add.existing(new TallGrass5(this, -32, 928));
    this.add.existing(new TallGrass3(this, 0, 880));
    this.add.existing(new Reeds1(this, -352, 800));
    this.add.existing(new Reeds1(this, -288, 832));
    this.add.existing(new Reeds1(this, -256, 784));
    this.add.existing(new Reeds1(this, -160, 800));
    this.add.existing(new Reeds1(this, 64, 896));
    this.add.existing(new Reeds1(this, -224, 832));
    this.add.existing(new FenceRightCorner(this, -48, 1264));
    this.add.existing(new FenceLeftCorner(this, -296, 1248));
    this.add.existing(new Tree7(this, 1024, 720));
    this.add.existing(new Tree7(this, 1088, 688));
    this.add.existing(new Tree1(this, 1184, 672));
    this.add.existing(new Tree4(this, 960, 720));
    this.add.existing(new Minerals(this, 928, 1120));
    this.add.existing(new Minerals(this, 896, 1136));
    this.add.existing(new Minerals(this, 864, 1120));
    this.add.existing(new Minerals(this, 896, 1104));
    this.add.existing(new Minerals(this, 832, 1104));
    this.add.existing(new UndeadLandDeadTreeAnim3(this, 181, 803));
    this.add.existing(new UndeadLandDeadTreeAnim2(this, 319, 808));
    this.add.existing(new UndeadLandDeadTreeAnim1(this, 224, 912));
  }

  override create(): void {
    this.editorCreate();
    super.create();
  }
}
