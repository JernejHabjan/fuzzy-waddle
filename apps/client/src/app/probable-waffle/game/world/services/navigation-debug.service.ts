import { environment } from "../../../../../environments/environment";
import { MovementOccupancyService, type MovementOccupancyDebugEntry } from "./movement-occupancy.service";
import { NavigationService } from "./navigation.service";
import { getSceneService } from "./scene-component-helpers";
import { HEIGHT_NAVIGATION_DIRECTIONS } from "./height-navigation-graph-builder";

const DYNAMIC_REDRAW_INTERVAL_MS = 250;

/**
 * Visual-only renderer for the height navigation graph. It must never mutate
 * graph, occupancy, or movement state because multiplayer decisions stay in the
 * deterministic simulation services.
 */
export class NavigationDebugService {
  static readonly ChangedEvent = "navigation-debug-changed";

  private enabled = false;
  private graphics?: Phaser.GameObjects.Graphics;
  private labels: Phaser.GameObjects.Text[] = [];
  private lastDynamicRedrawAt = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly tilemap: Phaser.Tilemaps.Tilemap
  ) {
    scene.events.on(NavigationService.UpdateNavigationEvent, this.redraw, this);
    scene.events.on(Phaser.Scenes.Events.UPDATE, this.updateDynamicOverlays, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  setEnabled(enabled: boolean): void {
    if (environment.production) return;
    this.enabled = enabled;
    this.scene.events.emit(NavigationDebugService.ChangedEvent, enabled);
    this.redraw();
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  private redraw(): void {
    if (!this.enabled || environment.production) {
      this.clear();
      return;
    }

    this.clear();
    this.graphics = this.scene.add.graphics();
    this.graphics.setDepth(10_000_000);

    this.drawGraph();
    this.drawOccupancy();
  }

  private updateDynamicOverlays(time: number): void {
    if (!this.enabled || environment.production) return;
    if (time - this.lastDynamicRedrawAt < DYNAMIC_REDRAW_INTERVAL_MS) return;
    this.lastDynamicRedrawAt = time;
    this.redraw();
  }

  private drawGraph(): void {
    const navigationService = getSceneService(this.scene, NavigationService);
    const graph = navigationService?.getHeightGraphDebugSnapshot();
    if (!navigationService || !graph || !this.graphics) return;
    const occupancy = getSceneService(this.scene, MovementOccupancyService);
    const occupancyEntries = occupancy?.getDebugSnapshot() ?? [];

    for (const row of graph.cells) {
      for (const cell of row) {
        if (!cell.isNavigable) continue;
        const center = navigationService.getTileWorldCenter(cell);
        if (!center) continue;
        this.drawDiamond(center.x, center.y, 0x19a84a, 0.18);
        this.addLabel(center.x, center.y - 16, `z:${cell.navigableHeight}`);

        const edges = graph.edgesByTileKey.get(`${cell.x},${cell.y}`) ?? [];
        const allowedKeys = new Set(edges.map((edge) => `${edge.to.x},${edge.to.y}`));
        for (const direction of HEIGHT_NAVIGATION_DIRECTIONS) {
          const to = { x: cell.x + direction.dx, y: cell.y + direction.dy };
          const target = navigationService.getTileWorldCenter(to);
          if (!target) continue;
          if (allowedKeys.has(`${to.x},${to.y}`)) {
            const edge = edges.find((candidate) => candidate.to.x === to.x && candidate.to.y === to.y);
            const isDynamicallyBlocked =
              !!edge && this.isDynamicallyBlocked(edge.to, edge.enterHeight, occupancyEntries);
            this.drawDirectedEdge(
              center.x,
              center.y,
              target.x,
              target.y,
              isDynamicallyBlocked ? 0xff8f1f : 0x4de96c,
              isDynamicallyBlocked ? 0.8 : 0.55
            );
            if (edge) {
              this.addLabel(
                Phaser.Math.Linear(center.x, target.x, 0.5),
                Phaser.Math.Linear(center.y, target.y, 0.5) - 8,
                `${edge.exitHeight}->${edge.enterHeight}`
              );
            }
          } else if (graph.cells[to.y]?.[to.x]?.isNavigable) {
            this.drawDirectedEdge(center.x, center.y, target.x, target.y, 0x8b1e1e, 0.35);
          }
        }
      }
    }
  }

  private isDynamicallyBlocked(
    tile: { x: number; y: number },
    heightLayer: number,
    occupancyEntries: MovementOccupancyDebugEntry[]
  ): boolean {
    return occupancyEntries.some(
      (entry) =>
        Math.round(entry.heightLayer) === Math.round(heightLayer) &&
        entry.tiles.some((entryTile) => entryTile.x === tile.x && entryTile.y === tile.y)
    );
  }

  private drawOccupancy(): void {
    const occupancy = getSceneService(this.scene, MovementOccupancyService);
    const navigationService = getSceneService(this.scene, NavigationService);
    if (!occupancy || !navigationService || !this.graphics) return;

    for (const entry of occupancy.getDebugSnapshot()) {
      const color = entry.source === "current" ? 0x3d7eff : entry.source === "step" ? 0xffc857 : 0xff5aa5;
      for (const tile of entry.tiles) {
        const center = navigationService.getTileWorldCenter(tile);
        if (!center) continue;
        this.drawDiamond(center.x, center.y - entry.heightLayer, color, 0.28);
      }
    }
  }

  private drawDiamond(x: number, y: number, color: number, alpha: number): void {
    if (!this.graphics) return;
    const halfWidth = this.tilemap.tileWidth / 2;
    const halfHeight = this.tilemap.tileHeight / 2;
    this.graphics.fillStyle(color, alpha);
    this.graphics.lineStyle(1, color, 0.75);
    this.graphics.beginPath();
    this.graphics.moveTo(x, y - halfHeight);
    this.graphics.lineTo(x + halfWidth, y);
    this.graphics.lineTo(x, y + halfHeight);
    this.graphics.lineTo(x - halfWidth, y);
    this.graphics.closePath();
    this.graphics.fillPath();
    this.graphics.strokePath();
  }

  private drawDirectedEdge(fromX: number, fromY: number, toX: number, toY: number, color: number, alpha: number): void {
    if (!this.graphics) return;
    const edgeStartX = Phaser.Math.Linear(fromX, toX, 0.28);
    const edgeStartY = Phaser.Math.Linear(fromY, toY, 0.28);
    const edgeEndX = Phaser.Math.Linear(fromX, toX, 0.44);
    const edgeEndY = Phaser.Math.Linear(fromY, toY, 0.44);
    this.graphics.lineStyle(2, color, alpha);
    this.graphics.lineBetween(edgeStartX, edgeStartY, edgeEndX, edgeEndY);
    this.graphics.fillStyle(color, alpha);
    this.graphics.fillCircle(edgeEndX, edgeEndY, 2.5);
  }

  private addLabel(x: number, y: number, text: string): void {
    const label = this.scene.add.text(x, y, text, {
      color: "#ffffff",
      fontFamily: "disposabledroid",
      fontSize: "10px",
      resolution: 2,
      stroke: "#000000",
      strokeThickness: 2
    });
    label.setOrigin(0.5, 0.5);
    label.setDepth(10_000_001);
    this.labels.push(label);
  }

  private clear(): void {
    this.graphics?.destroy();
    this.graphics = undefined;
    this.labels.forEach((label) => label.destroy());
    this.labels = [];
  }

  private destroy(): void {
    this.scene.events.off(NavigationService.UpdateNavigationEvent, this.redraw, this);
    this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.updateDynamicOverlays, this);
    this.clear();
  }
}
