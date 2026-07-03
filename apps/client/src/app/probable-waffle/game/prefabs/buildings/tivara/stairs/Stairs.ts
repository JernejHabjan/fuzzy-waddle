// You can write more code here

/* START OF COMPILED CODE */

import StairsTopLeft from "./StairsTopLeft";
/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import { ConstructionGameObjectInterfaceComponent } from "../../../../entity/components/construction/construction-game-object-interface-component";
import { getIsometricNeighbourDirectionsByTypes, getNeighbourDirectionsByTypes } from "../../../../data/tile-map-helpers";
import WatchTower from "../wall/WatchTower";
import { TilemapComponent } from "../../../../world/tilemap/tilemap.component";
import Wall from "../wall/Wall";
import StairsTopRight from "./StairsTopRight";
import StairsBottomLeft from "./StairsBottomLeft";
import StairsBottomRight from "./StairsBottomRight";
import { ActorDataChangedEvent, setActorData } from "../../../../data/actor-data";
import { getActorComponent } from "../../../../data/actor-component";
import { NavigableComponent } from "../../../../entity/components/movement/navigable-component";
import type { NavigablePath } from "../../../../entity/components/movement/navigable-path";
import type { HeightDirectionPortDefinition } from "../../../../entity/components/movement/navigable-definition";
import { getSceneService } from "../../../../world/services/scene-component-helpers";
import { SceneLightingService } from "../../../../world/services/lighting/scene-lighting.service";
import { StructureTopologyService } from "../navigation-topology.events";
import {
  countStructureDirectionMatches,
  hasAnyStructureDirection,
  toStructureNeighborDirections,
  type StructureDirectionKey,
  type StructureNeighborDirections
} from "../structure-topology.model";
/* END-USER-IMPORTS */

export default class Stairs extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 48);

    // cursor
    const cursor = scene.add.image(
      0.03889938974372242,
      -0.04250807446052818,
      "factions",
      "buildings/tivara/stairs/stairs_top_left.png"
    );
    cursor.setOrigin(0.5, 0.75);
    cursor.visible = false;
    this.add(cursor);

    // foundation
    const foundation = scene.add.image(0, -8, "factions", "buildings/tivara/wall/foundation/foundation_1.png");
    foundation.setInteractive(
      new Phaser.Geom.Polygon(
        "-0.10106595137152397 71.96885109399099 28.877763874655756 54.4686486665849 63.50182029016887 73.47424485118721 63.31364607051934 84.38834959085982 29.06593809430528 97.56054496632676 0.2752824879275302 84.20017537121029"
      ),
      Phaser.Geom.Polygon.Contains
    );
    foundation.setOrigin(0.5, 0.75);
    foundation.visible = false;
    this.add(foundation);

    // editorStairs
    const editorStairs = new StairsTopLeft(scene, 0.03889938974372242, -0.04250807446052818);
    editorStairs.visible = true;
    this.add(editorStairs);

    this.cursor = cursor;
    this.foundation = foundation;

    /* START-USER-CTR-CODE */
    editorStairs.destroy();
    this.updateStairs("topLeft");
    this.setup();
    /* END-USER-CTR-CODE */
  }

  private cursor: Phaser.GameObjects.Image;
  private foundation: Phaser.GameObjects.Image;

  /* START-USER-CODE */
  override name = ObjectNames.Stairs;
  private stairs?: Phaser.GameObjects.GameObject;
  private currentStairsKey?: StairsPrefabKey;
  private readonly topologyService = new StructureTopologyService(this, {
    onInitialRefresh: this.refreshStairsType.bind(this),
    onAdjacentTopologyChanged: this.refreshStairsType.bind(this)
  });

  updateStairs(stairsKey: StairsPrefabKey) {
    if (this.currentStairsKey === stairsKey) {
      return;
    }
    this.currentStairsKey = stairsKey;
    this.stairs?.destroy();

    const definition = STAIRS_PREFAB_DEFINITIONS[stairsKey];
    this.stairs = new definition.prefab(this.scene, 0, 0);
    this.add(this.stairs);
    getSceneService(this.scene, SceneLightingService)?.syncGameObjectTree(this);
    this.updateNavigablePath(definition);
  }

  private updateNavigablePath(definition: StairsPrefabDefinition) {
    const navigableComponent = getActorComponent(this, NavigableComponent);
    if (!navigableComponent) return;
    navigableComponent.allowNavigablePath(
      this.getAugmentedNavigablePath(definition),
      this.getAugmentedNavigablePorts(definition)
    );
  }

  private getAugmentedNavigablePath(definition: StairsPrefabDefinition): NavigablePath {
    const basePath = { ...definition.navigablePath };
    const elevatedNeighbors = this.cardinalElevatedNeighbors;
    if (elevatedNeighbors.top) basePath.top = true;
    if (elevatedNeighbors.bottom) basePath.bottom = true;
    if (elevatedNeighbors.left) basePath.left = true;
    if (elevatedNeighbors.right) basePath.right = true;
    return basePath;
  }

  private getAugmentedNavigablePorts(
    definition: StairsPrefabDefinition
  ): Partial<Record<keyof NavigablePath, HeightDirectionPortDefinition>> {
    const ports = { ...definition.navigablePorts };
    const high = { enterHeight: 64, exitHeight: 64 };
    const elevatedNeighbors = this.cardinalElevatedNeighbors;
    if (elevatedNeighbors.top) ports.top = high;
    if (elevatedNeighbors.bottom) ports.bottom = high;
    if (elevatedNeighbors.left) ports.left = high;
    if (elevatedNeighbors.right) ports.right = high;
    return ports;
  }

  private updateCurrentNavigablePath() {
    this.updateNavigablePath(STAIRS_PREFAB_DEFINITIONS[this.currentStairsKey ?? "topLeft"]);
  }

  private setup() {
    setActorData(
      this,
      [new ConstructionGameObjectInterfaceComponent(this, this.handlePrefabVisibility, this.cursor)],
      []
    );
    this.on(ActorDataChangedEvent, this.updateCurrentNavigablePath, this);
    this.topologyService.init();
  }

  private refreshStairsType() {
    if (!this.active) return;
    const definition = this.getStairsDefinitionAccordingToNeighbors();
    const stairs = this.stairs as any as Phaser.GameObjects.Container;
    if (this.cursor.visible) {
      if (this.currentStairsKey !== definition.key) {
        this.updateCursor(definition);
      }
    } else if (stairs.visible) {
      this.updateStairs(definition.key);
    }
    this.updateNavigablePath(definition);
  }

  /**
   * Stairs art points at the upper-side neighbor cluster. If more than one
   * cluster matches, keep the strongest match and preserve the current prefab
   * on exact ties to avoid visual jitter.
   */
  private getStairsDefinitionAccordingToNeighbors(): StairsPrefabDefinition {
    const current = this.currentStairsKey ? STAIRS_PREFAB_DEFINITIONS[this.currentStairsKey] : undefined;
    let bestDefinition = current ?? STAIRS_PREFAB_DEFINITIONS.topLeft;
    let bestScore = 0;

    for (const definition of STAIRS_PREFAB_LIST) {
      const score = countStructureDirectionMatches(this.visualNeighborDirections, definition.upperNeighborCluster);
      if (score > bestScore) {
        bestScore = score;
        bestDefinition = definition;
        continue;
      }
      if (score === bestScore && current?.key === definition.key) {
        bestDefinition = definition;
      }
    }

    return bestScore <= 0 ? STAIRS_PREFAB_DEFINITIONS.topLeft : bestDefinition;
  }

  private updateCursor(definition: StairsPrefabDefinition) {
    const stairs = this.cursor as any as Phaser.GameObjects.Image;
    stairs.setTexture("factions", definition.texture);
  }

  private handlePrefabVisibility = (progress: number | null) => {
    const stairs = this.stairs as any as Phaser.GameObjects.Container;
    const wasCursorVisible = this.cursor.visible;
    const wasStairsVisible = stairs.visible;
    this.cursor.visible = progress === null;
    stairs.visible = progress === 100;
    this.foundation.visible = progress !== null && progress < 100;
    if (!wasStairsVisible && stairs.visible) {
      this.refreshStairsType();
    }
    this.topologyService.notifyIfVisibilityChanged(
      [wasCursorVisible, wasStairsVisible],
      [this.cursor.visible, stairs.visible]
    );
  };

  private get visualNeighborDirections(): StructureNeighborDirections {
    return toStructureNeighborDirections(
      getIsometricNeighbourDirectionsByTypes(this, [Wall, WatchTower], TilemapComponent.tileWidth)
    );
  }

  private get elevatedNeighborDirections(): StructureNeighborDirections {
    return toStructureNeighborDirections(
      getNeighbourDirectionsByTypes(this, [Wall, WatchTower], TilemapComponent.tileWidth)
    );
  }

  private get cardinalElevatedNeighbors() {
    const directions = this.elevatedNeighborDirections;
    return {
      top: directions.top,
      bottom: directions.bottom,
      left: directions.left,
      right: directions.right
    };
  }

  override destroy(fromScene?: boolean) {
    this.off(ActorDataChangedEvent, this.updateCurrentNavigablePath, this);
    this.topologyService.destroy();
    super.destroy(fromScene);
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

type StairsPrefabClass = new (scene: Phaser.Scene, x?: number, y?: number) => Phaser.GameObjects.GameObject;

export interface StairsPrefabDefinition {
  key: StairsPrefabKey;
  prefab: StairsPrefabClass;
  texture: string;
  upperNeighborCluster: StructureDirectionKey[];
  navigablePath: NavigablePath;
  navigablePorts: Partial<Record<keyof NavigablePath, HeightDirectionPortDefinition>>;
}

export type StairsPrefabKey = "topLeft" | "topRight" | "bottomLeft" | "bottomRight";

const low = { enterHeight: 0, exitHeight: 0 };
const high = { enterHeight: 64, exitHeight: 64 };

/**
 * Stairs visual rules match the same-named diagonal cluster so one topRight
 * neighbor displays stairs_top_right, one bottomRight neighbor displays
 * stairs_bottom_right, and cardinal-only neighbors resolve to the adjacent
 * same-side stair. Navigation data intentionally preserves the current working
 * ports while moving them into the prefab definition table.
 */
export const STAIRS_PREFAB_DEFINITIONS: Record<StairsPrefabKey, StairsPrefabDefinition> = {
  topLeft: {
    key: "topLeft",
    prefab: StairsTopLeft,
    texture: "buildings/tivara/stairs/stairs_top_left.png",
    upperNeighborCluster: ["left", "topLeft", "top"],
    navigablePath: {
      topLeft: true,
      right: true,
      bottomRight: true,
      bottom: true
    },
    navigablePorts: {
      topLeft: high,
      right: low,
      bottomRight: low,
      bottom: low
    }
  },
  topRight: {
    key: "topRight",
    prefab: StairsTopRight,
    texture: "buildings/tivara/stairs/stairs_top_right.png",
    upperNeighborCluster: ["top", "topRight", "right"],
    navigablePath: {
      topRight: true,
      left: true,
      bottomLeft: true,
      bottom: true
    },
    navigablePorts: {
      topRight: high,
      left: low,
      bottomLeft: low,
      bottom: low
    }
  },
  bottomLeft: {
    key: "bottomLeft",
    prefab: StairsBottomLeft,
    texture: "buildings/tivara/stairs/stairs_bottom_left.png",
    upperNeighborCluster: ["left", "bottomLeft", "bottom"],
    navigablePath: {
      bottomLeft: true,
      top: true,
      topRight: true,
      right: true
    },
    navigablePorts: {
      bottomLeft: high,
      top: low,
      topRight: low,
      right: low
    }
  },
  bottomRight: {
    key: "bottomRight",
    prefab: StairsBottomRight,
    texture: "buildings/tivara/stairs/stairs_bottom_right.png",
    upperNeighborCluster: ["bottom", "bottomRight", "right"],
    navigablePath: {
      bottomRight: true,
      top: true,
      topLeft: true,
      left: true
    },
    navigablePorts: {
      bottomRight: high,
      top: low,
      topLeft: low,
      left: low
    }
  }
};

export const STAIRS_PREFAB_LIST = Object.values(STAIRS_PREFAB_DEFINITIONS);
export const STAIRS_PREFAB_KEYS = Object.keys(STAIRS_PREFAB_DEFINITIONS) as StairsPrefabKey[];

export function canStairsPrefabSnapToNeighbor(
  stairsKey: StairsPrefabKey,
  directions: Partial<StructureNeighborDirections>
): boolean {
  return hasAnyStructureDirection(directions, STAIRS_PREFAB_DEFINITIONS[stairsKey].upperNeighborCluster);
}
