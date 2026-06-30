import { environment } from "../../../../../environments/environment";
import { MovementOccupancyService } from "./movement-occupancy.service";
import { NavigationService } from "./navigation.service";
import { getSceneService } from "./scene-component-helpers";
import { HEIGHT_NAVIGATION_DIRECTIONS } from "./height-navigation-graph-builder";

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

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly tilemap: Phaser.Tilemaps.Tilemap
  ) {
    scene.events.on(NavigationService.UpdateNavigationEvent, this.redraw, this);
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

  private drawGraph(): void {
    const navigationService = getSceneService(this.scene, NavigationService);
    const graph = navigationService?.getHeightGraphDebugSnapshot();
    if (!navigationService || !graph || !this.graphics) return;

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
            this.drawDirectedEdge(center.x, center.y, target.x, target.y, 0x4de96c, 0.55);
          } else if (graph.cells[to.y]?.[to.x]?.isNavigable) {
            this.drawDirectedEdge(center.x, center.y, target.x, target.y, 0x8b1e1e, 0.35);
          }
        }
      }
    }
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
    this.clear();
  }
}
