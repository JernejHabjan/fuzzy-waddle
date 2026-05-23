// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import { ConstructionGameObjectInterfaceComponent } from "../../../entity/components/construction/construction-game-object-interface-component";
import { TendableGameObjectInterfaceComponent } from "../../../entity/components/tendable/tendable-game-object-interface-component";
import type { TendablePhase } from "../../../entity/components/tendable/tendable-component";
import { setActorData } from "../../../data/actor-data";
import { onObjectReady } from "../../../data/game-object-helper";
import { getActorComponent } from "../../../data/actor-component";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { ResourceSourceComponent } from "../../../entity/components/resource/resource-source-component";
import type { Subscription } from "rxjs";
import { RandomService } from "../../../world/services/random.service";
import CropsWheat from "../../outside/crops/wheat/CropsWheat";
import CropsBeans from "../../outside/crops/beans/CropsBeans";
import CropsCabbage from "../../outside/crops/cabbage/CropsCabbage";
import CropsCucumbers from "../../outside/crops/cucumbers/CropsCucumbers";
import CropsGrapes from "../../outside/crops/grapes/CropsGrapes";
import CropsPeppers from "../../outside/crops/peppers/CropsPeppers";
import CropsPineapple from "../../outside/crops/pineapple/CropsPineapple";
import CropsPumpkin from "../../outside/crops/pumpkin/CropsPumpkin";
import CropsSunflowers from "../../outside/crops/sunflowers/CropsSunflowers";
import CropsZucchini from "../../outside/crops/zucchini/CropsZucchini";
import CropsLettuce from "../../outside/crops/lettuce/CropsLettuce";
import type { GrowthStageInterface, GrowthStageCtor, CropResourceSourceInterface } from "../../../entity/components/tendable/growth-stage.interface";
import GroundCarrot from "../../outside/crops/ground/carrot/GroundCarrot";
import GroundBoletus from "../../outside/crops/ground/boletus/GroundBoletus";
import GroundChampignons from "../../outside/crops/ground/champignons/GroundChampignons";
import GroundTurnip from "../../outside/crops/ground/turnip/GroundTurnip";
import type { AnimationType } from "../../../entity/components/animation/animation-type";
import type { SoundType } from "../../../entity/components/actor-audio/sound-type";
/* END-USER-IMPORTS */

export default class Field extends Phaser.GameObjects.Container implements CropResourceSourceInterface {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 64, y ?? 144);

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-35.340558107590454 -12.362662959051235 -1.4848432736131016 -30.371021913294513 57.22240691721999 -1.5576475865052686 5.358333128999341 33.01840160564183 -56.95058885268239 7.806699069701239"
      ),
      Phaser.Geom.Polygon.Contains
    );
    this.scaleX = 1.2;
    this.scaleY = 1.2;

    // fieldCursor
    const fieldCursor = scene.add.image(
      -0.24104731556548842,
      -29.384973477389252,
      "factions",
      "buildings/misc/ruins-flat/ruins-flat-1.png"
    );
    fieldCursor.scaleX = 1.2;
    fieldCursor.scaleY = 1.2;
    fieldCursor.visible = false;
    this.add(fieldCursor);

    // fieldLevel1
    const fieldLevel1 = scene.add.image(
      -0.24104731556548842,
      -29.384973477389252,
      "factions",
      "buildings/misc/ruins-flat/ruins-flat-1.png"
    );
    this.add(fieldLevel1);

    this.fieldCursor = fieldCursor;
    this.fieldLevel1 = fieldLevel1;

    /* START-USER-CTR-CODE */
    this.setup();
    /* END-USER-CTR-CODE */
  }

  private fieldCursor: Phaser.GameObjects.Image;
  private fieldLevel1: Phaser.GameObjects.Image;

  /* START-USER-CODE */
  override name = ObjectNames.Field;

  /**
   * All crop types that can grow on a field.
   * Each constructor accepts (scene, x?, y?) and produces an Image that implements GrowthStageInterface.
   */
  private static readonly CROP_CONSTRUCTORS: readonly GrowthStageCtor[] = [
    CropsWheat,
    CropsBeans,
    CropsCabbage,
    CropsCucumbers,
    CropsGrapes,
    CropsPeppers,
    CropsPineapple,
    CropsPumpkin,
    CropsSunflowers,
    CropsZucchini,
    CropsLettuce,
    GroundCarrot,
    GroundBoletus,
    GroundChampignons,
    GroundTurnip
  ];

  /**
   * Isometric tile offsets for the 4 tiles in a 2×2 diamond covered by this field.
   * Tile size: 64×32. Layout (top, right, bottom, left):
   *   top:    (  0, -16 )
   *   right:  ( 32,   0 )
   *   bottom: (  0,  16 )
   *   left:   (-32,   0 )
   */
  private static readonly TILE_OFFSETS: ReadonlyArray<readonly [number, number]> = [
    [0, -16],
    [32, 0],
    [0, 16],
    [-32, 0]
  ];

  private cropInstances: GrowthStageInterface[] = [];
  private selectedCropTypeIndex = 0;
  /** Index of the highest growth stage reached (0–2). Depleted stage is index 3. */
  private currentGrowthStageIndex = 0;
  private resourceSubscription?: Subscription;

  private setup() {
    setActorData(
      this,
      [
        new ConstructionGameObjectInterfaceComponent(this, this.handleConstructionVisibility, this.fieldCursor),
        new TendableGameObjectInterfaceComponent(this, this.handleTendablePhase)
      ],
      []
    );
    // Pick random crop type once at construction time
    this.selectedCropTypeIndex = this.getDeterministicCropTypeIndex();
    // Subscribe to resource changes after actor data (and ResourceSourceComponent) is ready
    onObjectReady(this, this.subscribeToResourceChanges, this);
  }

  private subscribeToResourceChanges() {
    const resourceSource = getActorComponent(this, ResourceSourceComponent);
    if (!resourceSource) return;
    this.resourceSubscription = resourceSource.onResourcesChanged.subscribe(() => {
      this.updateDepletedCropVisuals(resourceSource);
    });
  }

  /**
   * As resources drain during harvesting, progressively show depleted frames on crops.
   * Depleted frame = stageIndex 3. Crops are depleted one-by-one from first to last.
   */
  private updateDepletedCropVisuals(resourceSource: ResourceSourceComponent) {
    if (this.cropInstances.length === 0) return;
    const maxResources = resourceSource.getMaximumResources();
    const currentResources = resourceSource.getCurrentResources();
    if (maxResources <= 0) return;
    const depletedFraction = 1 - currentResources / maxResources;
    const depletedCount = Math.round(depletedFraction * this.cropInstances.length);
    this.cropInstances.forEach((crop, i) => {
      crop.setStage(i < depletedCount ? 3 : this.currentGrowthStageIndex);
    });
  }

  private handleConstructionVisibility = (progress: number | null) => {
    this.fieldCursor.visible = progress === null;
    this.fieldLevel1.visible = progress !== null;
  };

  private handleTendablePhase = (phase: TendablePhase | null) => {
    if (phase === null || phase === 0) {
      // Bare soil or not yet ready — destroy any crop instances and pick new type
      this.destroyCropInstances();
      this.selectedCropTypeIndex = this.getDeterministicCropTypeIndex();
      this.currentGrowthStageIndex = 0;
      return;
    }

    // phases 1–4 map to stageIndex 0–2 (3 growth frames); stageIndex 3 is the depleted frame
    this.currentGrowthStageIndex = Math.min(phase - 1, 2);

    if (this.cropInstances.length === 0) {
      // First growth phase — spawn 4 crop prefabs at tile offsets
      this.spawnCropInstances(this.currentGrowthStageIndex);
    } else {
      // Advance to the next growth stage on existing instances
      this.cropInstances.forEach((crop) => crop.setStage(this.currentGrowthStageIndex));
    }
  };

  private spawnCropInstances(stageIndex: number) {
    const CropClass = Field.CROP_CONSTRUCTORS[this.selectedCropTypeIndex];
    if (!CropClass) return;
    for (const [dx, dy] of Field.TILE_OFFSETS) {
      const crop = new CropClass(this.scene, dx, dy - 8);
      crop.setStage(stageIndex);
      this.add(crop);
      this.cropInstances.push(crop);
    }
  }

  private destroyCropInstances() {
    this.cropInstances.forEach((crop) => crop.destroy());
    this.cropInstances = [];
  }

  private getDeterministicCropTypeIndex(): number {
    const randomService = getSceneService(this.scene, RandomService);
    if (!randomService) {
      return Phaser.Math.Between(0, Field.CROP_CONSTRUCTORS.length - 1);
    }
    return randomService.between(0, Field.CROP_CONSTRUCTORS.length - 1);
  }

  /** Returns the harvest animation for the current crop type, or null if no crops are spawned. */
  getActiveCropHarvestAnimation(): AnimationType | null {
    return this.cropInstances[0]?.harvestAnimation ?? null;
  }

  /** Returns the harvest sound for the current crop type, or null if no crops are spawned. */
  getActiveCropHarvestSound(): SoundType | null {
    return this.cropInstances[0]?.harvestSound ?? null;
  }

  /** Returns the tending animation for the current crop type, or null if no crops are spawned. */
  getActiveCropTendAnimation(): AnimationType | null {
    return this.cropInstances[0]?.tendAnimation ?? null;
  }

  override destroy(fromScene?: boolean) {
    this.resourceSubscription?.unsubscribe();
    this.destroyCropInstances();
    super.destroy(fromScene);
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
