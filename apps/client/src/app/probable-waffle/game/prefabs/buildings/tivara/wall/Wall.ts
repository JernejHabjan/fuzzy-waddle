// You can write more code here

/* START OF COMPILED CODE */

import WallTopRightBottomLeft from "./WallTopRightBottomLeft";
/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import WallTopRightBottomRight from "./WallTopRightBottomRight";
import WallTopLeftBottomRight from "./WallTopLeftBottomRight";
import WallTopLeftBottomLeft from "./WallTopLeftBottomLeft";
import WallEmpty from "./WallEmpty";
import WallTopLeft from "./WallTopLeft";
import WallTopRight from "./WallTopRight";
import WallBottomLeft from "./WallBottomLeft";
import WallBottomRight from "./WallBottomRight";
import { ConstructionGameObjectInterfaceComponent } from "../../../../entity/components/construction/construction-game-object-interface-component";
import WallBottomLeftBottomRight from "./WallBottomLeftBottomRight";
import WallTopLeftTopRight from "./WallTopLeftTopRight";
import WallFull from "./WallFull";
import WallTopLeftBottomRightBottomLeft from "./WallTopLeftBottomRightBottomLeft";
import WallTopLeftTopRightBottomRight from "./WallTopLeftTopRightBottomRight";
import WallBottomLeftBottomRightTopRight from "./WallBottomLeftBottomRightTopRight";
import WallBottomLeftTopLeftTopRight from "./WallBottomLeftTopLeftTopRight";
import WatchTower from "./WatchTower";
import Stairs from "../stairs/Stairs";
import { getIsometricNeighbourDirectionsByTypes, getNeighbourDirectionsByTypes } from "../../../../data/tile-map-helpers";
import { TilemapComponent } from "../../../../world/tilemap/tilemap.component";
import { ActorDataChangedEvent, setActorData } from "../../../../data/actor-data";
import { getActorComponent } from "../../../../data/actor-component";
import { NavigableComponent } from "../../../../entity/components/movement/navigable-component";
import type { HeightDirectionPortDefinition } from "../../../../entity/components/movement/navigable-definition";
import type { NavigablePath } from "../../../../entity/components/movement/navigable-path";
import { getSceneService } from "../../../../world/services/scene-component-helpers";
import { SceneLightingService } from "../../../../world/services/lighting/scene-lighting.service";
import { StructureTopologyService } from "../navigation-topology.events";
import {
  buildWallAccessDirections,
  buildWallOpenVisualCorners,
  toStructureNeighborDirections,
  type StructureCornerKey,
  type StructureNeighborDirections
} from "../structure-topology.model";
/* END-USER-IMPORTS */

export default class Wall extends Phaser.GameObjects.Container {

  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 80.06815881041706);

    // foundation
    const foundation = scene.add.image(0, 0, "factions", "buildings/tivara/wall/foundation/foundation_1.png");
    foundation.setInteractive(new Phaser.Geom.Polygon("-0.9934205307175148 83.52408318472752 -0.6619106331295725 70.26368728120998 27.51643066184519 51.69913301628543 63.31949960134254 71.92123676914967 62.656479806166665 83.52408318472752 28.510960354609008 97.115988985833"), Phaser.Geom.Polygon.Contains);
    foundation.setOrigin(0.5, 0.8352819626557144);
    foundation.visible = false;
    this.add(foundation);

    // cursor
    const cursor = scene.add.image(0, 0, "factions", "buildings/tivara/wall/wall_top_right_bottom_left.png");
    cursor.setOrigin(0.5, 0.8352819626557144);
    cursor.visible = false;
    this.add(cursor);

    // editorWall
    const editorWall = new WallTopRightBottomLeft(scene, 0, 0);
    this.add(editorWall);

    this.foundation = foundation;
    this.cursor = cursor;

    /* START-USER-CTR-CODE */
    editorWall.destroy();
    this.updateWall("full");
    this.setup();
    /* END-USER-CTR-CODE */
  }

  private foundation: Phaser.GameObjects.Image;
  private cursor: Phaser.GameObjects.Image;

  /* START-USER-CODE */
  override name = ObjectNames.Wall;

  private wall?: Phaser.GameObjects.GameObject;
  private currentWallKey?: WallPrefabKey;
  private readonly topologyService = new StructureTopologyService(this, {
    onInitialRefresh: this.refreshWallType.bind(this),
    onAdjacentTopologyChanged: this.refreshWallType.bind(this)
  });

  /**
   * Rebuilds the rendered wall segment and reapplies the matching navigation
   * directions. Prefab key, visual corners, and accessible sides intentionally
   * come from the same neighbor snapshot.
   */
  updateWall(wallKey: WallPrefabKey) {
    if (this.currentWallKey === wallKey) {
      return;
    }
    this.currentWallKey = wallKey;
    this.wall?.destroy();

    const definition = WALL_PREFAB_DEFINITIONS[wallKey];
    this.wall = new definition.prefab(this.scene, 0, 0);
    this.add(this.wall);
    getSceneService(this.scene, SceneLightingService)?.syncGameObjectTree(this);

    this.updateNavigablePath(definition);
  }

  private updateNavigablePath(definition: WallPrefabDefinition) {
    const navigableComponent = getActorComponent(this, NavigableComponent);
    if (!navigableComponent) return;
    navigableComponent.allowNavigablePath(
      this.getAugmentedNavigablePath(definition),
      this.getAugmentedNavigablePorts(definition)
    );
  }

  private getAugmentedNavigablePath(definition: WallPrefabDefinition): NavigablePath {
    // Base wall paths describe the prefab's open corners. Cardinal neighbors can
    // also open a straight high-side continuation across adjacent segments.
    const basePath = { ...definition.navigablePath };
    const elevatedNeighbors = this.cardinalElevatedNeighbors;
    if (elevatedNeighbors.top) basePath.top = true;
    if (elevatedNeighbors.bottom) basePath.bottom = true;
    if (elevatedNeighbors.left) basePath.left = true;
    if (elevatedNeighbors.right) basePath.right = true;
    return basePath;
  }

  private getAugmentedNavigablePorts(
    definition: WallPrefabDefinition
  ): Partial<Record<keyof NavigablePath, HeightDirectionPortDefinition>> {
    const high = { enterHeight: 64, exitHeight: 64 };
    const path = this.getAugmentedNavigablePath(definition);
    const ports: Partial<Record<keyof NavigablePath, HeightDirectionPortDefinition>> = {};
    for (const direction of Object.keys(path) as (keyof NavigablePath)[]) {
      if (path[direction]) ports[direction] = high;
    }
    return ports;
  }

  /**
   * Reapplies the current wall prefab's navigable contract after actor data or
   * visibility changes without rebuilding the rendered child prefab.
   */
  private updateCurrentNavigablePath() {
    this.updateNavigablePath(WALL_PREFAB_DEFINITIONS[this.currentWallKey ?? "full"]);
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

  private refreshWallType() {
    if (!this.active) return;
    const definition = this.getWallDefinitionAccordingToNeighbors();
    const wall = this.wall as any as Phaser.GameObjects.Container;
    if (this.cursor.visible) {
      if (this.currentWallKey !== definition.key) {
        this.updateCursor(definition);
      }
    } else if (wall.visible) {
      this.updateWall(definition.key);
    }
    this.updateNavigablePath(definition);
  }

  /**
   * Wall prefab names describe extended corners. Elevated neighbors mark open
   * corners; cardinal-only sides span both corners on that side.
   */
  private getWallDefinitionAccordingToNeighbors(): WallPrefabDefinition {
    const openCorners = buildWallOpenVisualCorners(this.visualNeighborDirections);
    return WALL_PREFAB_DEFINITIONS[WALL_PREFAB_BY_OPEN_CORNERS[toOpenCornerSignature(openCorners)]];
  }

  /**
   * Updates the cursor texture so placement previews mirror the resolved wall
   * topology without swapping the full prefab container.
   */
  private updateCursor(definition: WallPrefabDefinition) {
    const wall = this.cursor as any as Phaser.GameObjects.Image;
    wall.setTexture("factions", definition.texture);
  }

  private handlePrefabVisibility = (progress: number | null) => {
    const wall = this.wall as any as Phaser.GameObjects.Container;
    const wasCursorVisible = this.cursor.visible;
    const wasWallVisible = wall.visible;
    this.cursor.visible = progress === null;
    wall.visible = progress === 100;
    this.foundation.visible = progress !== null && progress < 100;
    if (!wasWallVisible && wall.visible) {
      this.refreshWallType();
    }
    this.topologyService.notifyIfVisibilityChanged(
      [wasCursorVisible, wasWallVisible],
      [this.cursor.visible, wall.visible]
    );
  };

  private get visualNeighborDirections(): StructureNeighborDirections {
    return toStructureNeighborDirections(
      getIsometricNeighbourDirectionsByTypes(this, [Wall, WatchTower, Stairs], TilemapComponent.tileWidth)
    );
  }

  private get elevatedNeighborDirections(): StructureNeighborDirections {
    return toStructureNeighborDirections(
      getNeighbourDirectionsByTypes(this, [Wall, WatchTower, Stairs], TilemapComponent.tileWidth)
    );
  }

  private get wallAccessDirections(): StructureNeighborDirections {
    // Visual corners and walkable access are related but not identical: a pair
    // of diagonal neighbors can imply a straight traversable side.
    return buildWallAccessDirections(this.elevatedNeighborDirections);
  }

  private get cardinalElevatedNeighbors() {
    const directions = this.wallAccessDirections;
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

type WallPrefabClass = new (scene: Phaser.Scene, x?: number, y?: number) => Phaser.GameObjects.GameObject;

export interface WallPrefabDefinition {
  key: WallPrefabKey;
  prefab: WallPrefabClass;
  texture: string;
  extendedCorners: StructureCornerKey[];
  navigablePath: NavigablePath;
}

export type WallPrefabKey =
  | "topRightBottomRight"
  | "topRightBottomLeft"
  | "topLeftBottomRight"
  | "topLeftBottomLeft"
  | "empty"
  | "full"
  | "topLeft"
  | "topRight"
  | "bottomLeft"
  | "bottomRight"
  | "topLeftTopRight"
  | "bottomLeftBottomRight"
  | "topLeftTopRightBottomLeft"
  | "topRightBottomLeftBottomRight"
  | "topLeftTopRightBottomRight"
  | "topLeftBottomLeftBottomRight";

/**
 * Wall definitions are keyed by extended/blocked corners. The navigable path is
 * the matching approachable/open directions and intentionally preserves the
 * current height-navigation behavior.
 */
export const WALL_PREFAB_DEFINITIONS: Record<WallPrefabKey, WallPrefabDefinition> = {
  topRightBottomRight: {
    key: "topRightBottomRight",
    prefab: WallTopRightBottomRight,
    texture: "buildings/tivara/wall/wall_top_right_bottom_right.png",
    extendedCorners: ["topRight", "bottomRight"],
    navigablePath: { topLeft: true, left: true, bottomLeft: true }
  },
  topRightBottomLeft: {
    key: "topRightBottomLeft",
    prefab: WallTopRightBottomLeft,
    texture: "buildings/tivara/wall/wall_top_right_bottom_left.png",
    extendedCorners: ["topRight", "bottomLeft"],
    navigablePath: { topLeft: true, bottomRight: true }
  },
  topLeftBottomRight: {
    key: "topLeftBottomRight",
    prefab: WallTopLeftBottomRight,
    texture: "buildings/tivara/wall/wall_top_left_bottom_right.png",
    extendedCorners: ["topLeft", "bottomRight"],
    navigablePath: { topRight: true, bottomLeft: true }
  },
  topLeftBottomLeft: {
    key: "topLeftBottomLeft",
    prefab: WallTopLeftBottomLeft,
    texture: "buildings/tivara/wall/wall_top_left_bottom_left.png",
    extendedCorners: ["topLeft", "bottomLeft"],
    navigablePath: { topRight: true, right: true, bottomRight: true }
  },
  empty: {
    key: "empty",
    prefab: WallEmpty,
    texture: "buildings/tivara/wall/wall_empty.png",
    extendedCorners: [],
    navigablePath: {
      top: true,
      bottom: true,
      left: true,
      right: true,
      topLeft: true,
      topRight: true,
      bottomLeft: true,
      bottomRight: true
    }
  },
  full: {
    key: "full",
    prefab: WallFull,
    texture: "buildings/tivara/wall/wall_full.png",
    extendedCorners: ["topLeft", "topRight", "bottomLeft", "bottomRight"],
    navigablePath: {}
  },
  topLeft: {
    key: "topLeft",
    prefab: WallTopLeft,
    texture: "buildings/tivara/wall/wall_top_left.png",
    extendedCorners: ["topLeft"],
    navigablePath: { topRight: true, right: true, bottomRight: true, bottom: true, bottomLeft: true }
  },
  topRight: {
    key: "topRight",
    prefab: WallTopRight,
    texture: "buildings/tivara/wall/wall_top_right.png",
    extendedCorners: ["topRight"],
    navigablePath: { topLeft: true, left: true, bottomLeft: true, bottom: true, bottomRight: true }
  },
  bottomLeft: {
    key: "bottomLeft",
    prefab: WallBottomLeft,
    texture: "buildings/tivara/wall/wall_bottom_left.png",
    extendedCorners: ["bottomLeft"],
    navigablePath: { topLeft: true, top: true, topRight: true, right: true, bottomRight: true }
  },
  bottomRight: {
    key: "bottomRight",
    prefab: WallBottomRight,
    texture: "buildings/tivara/wall/wall_bottom_right.png",
    extendedCorners: ["bottomRight"],
    navigablePath: { topRight: true, top: true, topLeft: true, left: true, bottomLeft: true }
  },
  topLeftTopRight: {
    key: "topLeftTopRight",
    prefab: WallTopLeftTopRight,
    texture: "buildings/tivara/wall/wall_top_left_top_right.png",
    extendedCorners: ["topLeft", "topRight"],
    navigablePath: { bottomLeft: true, bottom: true, bottomRight: true }
  },
  bottomLeftBottomRight: {
    key: "bottomLeftBottomRight",
    prefab: WallBottomLeftBottomRight,
    texture: "buildings/tivara/wall/wall_bottom_left_bottom_right.png",
    extendedCorners: ["bottomLeft", "bottomRight"],
    navigablePath: { topRight: true, top: true, topLeft: true }
  },
  topLeftTopRightBottomLeft: {
    key: "topLeftTopRightBottomLeft",
    prefab: WallBottomLeftTopLeftTopRight,
    texture: "buildings/tivara/wall/wall_bottom_left_top_left_top_right.png",
    extendedCorners: ["topLeft", "topRight", "bottomLeft"],
    navigablePath: { bottomRight: true }
  },
  topRightBottomLeftBottomRight: {
    key: "topRightBottomLeftBottomRight",
    prefab: WallBottomLeftBottomRightTopRight,
    texture: "buildings/tivara/wall/wall_bottom_left_bottom_right_top_right.png",
    extendedCorners: ["topRight", "bottomLeft", "bottomRight"],
    navigablePath: { topLeft: true }
  },
  topLeftTopRightBottomRight: {
    key: "topLeftTopRightBottomRight",
    prefab: WallTopLeftTopRightBottomRight,
    texture: "buildings/tivara/wall/wall_top_left_top_right_bottom_right.png",
    extendedCorners: ["topLeft", "topRight", "bottomRight"],
    navigablePath: { bottomLeft: true }
  },
  topLeftBottomLeftBottomRight: {
    key: "topLeftBottomLeftBottomRight",
    prefab: WallTopLeftBottomRightBottomLeft,
    texture: "buildings/tivara/wall/wall_top_left_bottom_right_bottom_left.png",
    extendedCorners: ["topLeft", "bottomLeft", "bottomRight"],
    navigablePath: { topRight: true }
  }
};

export const WALL_PREFAB_LIST = Object.values(WALL_PREFAB_DEFINITIONS);
export const WALL_PREFAB_KEYS = Object.keys(WALL_PREFAB_DEFINITIONS) as WallPrefabKey[];

type WallOpenCornerSignature = `${0 | 1}${0 | 1}${0 | 1}${0 | 1}`;

const WALL_PREFAB_BY_OPEN_CORNERS: Record<WallOpenCornerSignature, WallPrefabKey> = {
  "0000": "full",
  "0001": "topLeftTopRightBottomLeft",
  "0010": "topLeftTopRightBottomRight",
  "0011": "topLeftTopRight",
  "0100": "topLeftBottomLeftBottomRight",
  "0101": "topLeftBottomLeft",
  "0110": "topLeftBottomRight",
  "0111": "topLeft",
  "1000": "topRightBottomLeftBottomRight",
  "1001": "topRightBottomLeft",
  "1010": "topRightBottomRight",
  "1011": "topRight",
  "1100": "bottomLeftBottomRight",
  "1101": "bottomLeft",
  "1110": "bottomRight",
  "1111": "empty"
};

/**
 * Encodes open corners in a fixed order so the lookup table stays compact and
 * deterministic across neighbor refreshes.
 */
function toOpenCornerSignature(openCorners: Record<StructureCornerKey, boolean>): WallOpenCornerSignature {
  return `${openCorners.topLeft ? 1 : 0}${openCorners.topRight ? 1 : 0}${openCorners.bottomLeft ? 1 : 0}${openCorners.bottomRight ? 1 : 0}`;
}
