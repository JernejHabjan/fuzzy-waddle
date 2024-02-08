import EasyStar from "easystarjs";
import { Vector2Simple } from "@fuzzy-waddle/api-interfaces";
import { Pathfinder } from "../../world/map/pathfinder";

export class NavigationService {
  private easyStar: EasyStar.js;
  private grid: number[][] = [];
  private tilemapGrid: number[][] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly tilemap: Phaser.Tilemaps.Tilemap
  ) {
    this.extractTilemapGrid();

    this.scene.events.on("updateNavigation", this.updateNavigation, this);
    this.easyStar = new EasyStar.js();

    this.updateNavigation();

    this.find({ x: 25, y: 25 }, { x: 33, y: 33 }); // todo for test
  }

  private setup() {
    const objectsGrid = this.extractGridFromObjects();
    this.grid = this.tilemapGrid.map((row, i) => row.map((tile, j) => tile + objectsGrid[i][j]));
    this.setupNavigation();
  }

  private async find(from: Vector2Simple, to: Vector2Simple): Promise<Vector2Simple[]> {
    return new Promise((resolve, reject) => {
      this.easyStar.findPath(from.x, from.y, to.x, to.y, (path) => {
        if (!path) {
          console.log("Path was not found.");
          reject("Path was not found.");
        } else {
          if (path.length === 0) {
            resolve([]);
            return;
          }
          // draw straight line from start to end colored red
          let graphics = this.scene.add.graphics();
          graphics.lineStyle(2, 0xff0000, 1);
          graphics.beginPath();
          let tileCenter = Pathfinder.getTileWorldCenterByPath(path[0]);
          graphics.moveTo(tileCenter.x, tileCenter.y);
          tileCenter = Pathfinder.getTileWorldCenterByPath(path[path.length - 1]);
          graphics.lineTo(tileCenter.x, tileCenter.y);
          graphics.strokePath();

          // draw phaser line from one point to the next
          graphics = this.scene.add.graphics();
          graphics.lineStyle(2, 0xffffff, 1);
          graphics.beginPath();
          tileCenter = Pathfinder.getTileWorldCenterByPath(path[0]);
          graphics.moveTo(tileCenter.x, tileCenter.y);

          const allTileWorldXYCentersWithoutFirst = path.map((path) => Pathfinder.getTileWorldCenterByPath(path));
          allTileWorldXYCentersWithoutFirst.shift();

          for (let i = 0; i < path.length - 1; i++) {
            tileCenter = allTileWorldXYCentersWithoutFirst[i];
            graphics.lineTo(tileCenter.x, tileCenter.y);
          }
          graphics.strokePath();

          // map all tileXYPathWithoutFirst to tilePlacementWorldWithProperties
          const tilePlacementWorldWithPropertiesPath = path.map((tileXY) => ({
            x: tileXY.x,
            y: tileXY.y
          }));
          resolve(tilePlacementWorldWithPropertiesPath);
        }
      });
      this.easyStar.calculate();
    });
  }

  private extractTilemapGrid() {
    const data = this.tilemap.layers[0].data;
    const grid: number[][] = [];
    data.forEach((row) => {
      const newRow: number[] = [];
      row.forEach((tile) => {
        newRow.push(tile.properties.navigationRestriction ? 1 : 0);
      });
      grid.push(newRow);
    });
    this.tilemapGrid = grid;
  }

  private extractGridFromObjects(): number[][] {
    const emptyGrid = this.tilemapGrid.map((row) => row.map(() => 0));

    // todo
    // get objects from scene - if bridge, set grid to 0
    // if wall, set grid to 1
    // if navigatable wall, set grid to 0

    return emptyGrid;
  }

  private setupNavigation() {
    this.easyStar.setGrid(this.grid);
    this.easyStar.setAcceptableTiles([0]);
    this.easyStar.enableDiagonals();
  }

  private updateNavigation() {
    this.setup();
  }
}
