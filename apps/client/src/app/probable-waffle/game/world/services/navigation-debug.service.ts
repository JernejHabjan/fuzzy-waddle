import { environment } from "../../../../../environments/environment";
import { MovementOccupancyService, type MovementOccupancyDebugEntry } from "./movement-occupancy.service";
import { NavigationService } from "./navigation.service";
import { getSceneService } from "./scene-component-helpers";
import { HEIGHT_NAVIGATION_DIRECTIONS } from "./height-navigation-graph-builder";
import { IsoHelper } from "../tilemap/iso-helper";

const DYNAMIC_REDRAW_INTERVAL_MS = 1000;
const STATIC_REDRAW_INTERVAL_MS = 1000;
const CAMERA_CULL_PADDING_TILES = 2;
const EDGE_LABEL_MIN_ZOOM = 1.1;
const LABEL_POOL_MIN_SIZE = 32;

/**
 * Visual-only renderer for the height navigation graph. It must never mutate
 * graph, occupancy, or movement state because multiplayer decisions stay in the
 * deterministic simulation services.
 */
export class NavigationDebugService {
  static readonly ChangedEvent = "navigation-debug-changed";

  private enabled = false;
  private staticGraphics?: Phaser.GameObjects.Graphics;
  private dynamicGraphics?: Phaser.GameObjects.Graphics;
  private labels: Phaser.GameObjects.Text[] = [];
  private redrawTimer?: Phaser.Time.TimerEvent;
  private lastDynamicRedrawAt = 0;
  private lastStaticRedrawAt = 0;
  private lastCameraSignature = "";
  private readonly tileCenterCache = new Map<number, { x: number; y: number }>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly tilemap: Phaser.Tilemaps.Tilemap
  ) {
    scene.events.on(NavigationService.UpdateNavigationEvent, this.handleNavigationUpdated, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  setEnabled(enabled: boolean): void {
    if (environment.production) return;
    this.enabled = enabled;
    this.scene.events.emit(NavigationDebugService.ChangedEvent, enabled);
    if (enabled) {
      this.startRedrawTimer();
    } else {
      this.stopRedrawTimer();
    }
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

    this.ensureGraphics();
    this.redrawStaticOverlays(true);
    this.redrawDynamicOverlays();
  }

  private handleNavigationUpdated(): void {
    this.lastStaticRedrawAt = 0;
    this.lastCameraSignature = "";
    if (!this.enabled || environment.production) return;
    this.redraw();
  }

  private updateDynamicOverlays(): void {
    if (!this.enabled || environment.production) return;
    const time = this.scene.time.now;
    const shouldRedrawStatic = this.shouldRedrawStatic(time);
    if (shouldRedrawStatic) {
      this.lastStaticRedrawAt = time;
      this.redrawStaticOverlays();
    }
    if (time - this.lastDynamicRedrawAt < DYNAMIC_REDRAW_INTERVAL_MS) return;
    this.lastDynamicRedrawAt = time;
    this.redrawDynamicOverlays();
  }

  private startRedrawTimer(): void {
    if (this.redrawTimer) return;
    this.redrawTimer = this.scene.time.addEvent({
      delay: Math.min(DYNAMIC_REDRAW_INTERVAL_MS, STATIC_REDRAW_INTERVAL_MS),
      loop: true,
      callback: this.updateDynamicOverlays,
      callbackScope: this
    });
  }

  private stopRedrawTimer(): void {
    this.redrawTimer?.destroy();
    this.redrawTimer = undefined;
  }

  private ensureGraphics(): void {
    if (!this.staticGraphics) {
      this.staticGraphics = this.scene.add.graphics();
      this.staticGraphics.setDepth(10_000_000);
    }
    if (!this.dynamicGraphics) {
      this.dynamicGraphics = this.scene.add.graphics();
      this.dynamicGraphics.setDepth(10_000_001);
    }
  }

  private shouldRedrawStatic(time: number): boolean {
    if (!this.staticGraphics) return true;
    if (time - this.lastStaticRedrawAt < STATIC_REDRAW_INTERVAL_MS) return false;
    const nextCameraSignature = this.getCameraSignature();
    return nextCameraSignature !== this.lastCameraSignature;
  }

  private redrawStaticOverlays(force: boolean = false): void {
    this.ensureGraphics();
    if (!this.staticGraphics) return;
    const nextCameraSignature = this.getCameraSignature();
    if (!force && nextCameraSignature === this.lastCameraSignature) {
      return;
    }
    this.lastCameraSignature = nextCameraSignature;
    this.staticGraphics.clear();
    this.clearLabels();
    this.drawGraph();
  }

  private redrawDynamicOverlays(): void {
    this.ensureGraphics();
    this.dynamicGraphics?.clear();
    this.drawDynamicBlockedEdges();
    this.drawOccupancy();
  }

  private drawGraph(): void {
    const navigationService = getSceneService(this.scene, NavigationService);
    const graph = navigationService?.getHeightGraphDebugSnapshot();
    if (!navigationService || !graph || !this.staticGraphics) return;
    const visibleWorld = this.getExpandedVisibleWorldBounds();
    const labelViewport = this.getLabelViewportBounds();
    const visibleTiles = this.getVisibleTileBounds(graph.cells);

    for (let y = visibleTiles.minY; y <= visibleTiles.maxY; y++) {
      const row = graph.cells[y];
      if (!row) continue;
      for (let x = visibleTiles.minX; x <= visibleTiles.maxX; x++) {
        const cell = row[x];
        if (!cell) continue;
        if (!cell.isNavigable) continue;
        const center = this.getTileCenter(cell.x, cell.y);
        if (!center) continue;
        if (!visibleWorld.contains(center.x, center.y)) continue;
        this.drawDiamond(center.x, center.y, 0x19a84a, 0.18);
        if (labelViewport.contains(center.x, center.y - 16)) {
          this.addLabel(center.x, center.y - 16, `z:${cell.navigableHeight}`);
        }

        // Green arrows are traversable directed edges. Red arrows mark a
        // neighboring navigable tile that exists but rejects traversal from
        // this cell because the height ports do not match.
        const edges = graph.edgesByTileKey.get(`${cell.x},${cell.y}`) ?? [];
        const allowedKeys = new Set(edges.map((edge) => `${edge.to.x},${edge.to.y}`));
        for (const direction of HEIGHT_NAVIGATION_DIRECTIONS) {
          const to = { x: cell.x + direction.dx, y: cell.y + direction.dy };
          const target = this.getTileCenter(to.x, to.y);
          if (!target) continue;
          if (!visibleWorld.contains(target.x, target.y) && !visibleWorld.contains(center.x, center.y)) continue;
          if (allowedKeys.has(`${to.x},${to.y}`)) {
            const edge = edges.find((candidate) => candidate.to.x === to.x && candidate.to.y === to.y);
            this.drawDirectedEdge(center.x, center.y, target.x, target.y, 0x4de96c, 0.55);
            if (edge && this.scene.cameras.main.zoom >= EDGE_LABEL_MIN_ZOOM) {
              const labelX = Phaser.Math.Linear(center.x, target.x, 0.5);
              const labelY = Phaser.Math.Linear(center.y, target.y, 0.5) - 8;
              if (labelViewport.contains(labelX, labelY)) {
                this.addLabel(labelX, labelY, `${edge.exitHeight}->${edge.enterHeight}`);
              }
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

  private drawDynamicBlockedEdges(): void {
    const navigationService = getSceneService(this.scene, NavigationService);
    const graph = navigationService?.getHeightGraphDebugSnapshot();
    const occupancyEntries = getSceneService(this.scene, MovementOccupancyService)?.getDebugSnapshot() ?? [];
    if (!navigationService || !graph || !this.dynamicGraphics || occupancyEntries.length === 0) return;
    const visibleWorld = this.getExpandedVisibleWorldBounds();
    const visibleTiles = this.getVisibleTileBounds(graph.cells);

    for (let y = visibleTiles.minY; y <= visibleTiles.maxY; y++) {
      const row = graph.cells[y];
      if (!row) continue;
      for (let x = visibleTiles.minX; x <= visibleTiles.maxX; x++) {
        const cell = row[x];
        if (!cell) continue;
        if (!cell.isNavigable) continue;
        const center = this.getTileCenter(cell.x, cell.y);
        if (!center || !visibleWorld.contains(center.x, center.y)) continue;
        const edges = graph.edgesByTileKey.get(`${cell.x},${cell.y}`) ?? [];
        for (const edge of edges) {
          // Orange arrows reuse the static graph edge but highlight that the
          // destination tile/height is currently blocked by occupancy.
          if (!this.isDynamicallyBlocked(edge.to, edge.enterHeight, occupancyEntries)) continue;
          const target = this.getTileCenter(edge.to.x, edge.to.y);
          if (!target) continue;
          if (!visibleWorld.contains(target.x, target.y) && !visibleWorld.contains(center.x, center.y)) continue;
          this.drawDirectedEdge(center.x, center.y, target.x, target.y, 0xff8f1f, 0.8, this.dynamicGraphics);
        }
      }
    }
  }

  private drawOccupancy(): void {
    const occupancy = getSceneService(this.scene, MovementOccupancyService);
    if (!occupancy || !this.dynamicGraphics) return;
    const visibleWorld = this.getExpandedVisibleWorldBounds();

    for (const entry of occupancy.getDebugSnapshot()) {
      const color = entry.source === "current" ? 0x3d7eff : entry.source === "step" ? 0xffc857 : 0xff5aa5;
      for (const tile of entry.tiles) {
        const center = this.getTileCenter(tile.x, tile.y);
        if (!center) continue;
        if (!visibleWorld.contains(center.x, center.y)) continue;
        this.drawDiamond(center.x, center.y - entry.heightLayer, color, 0.28, this.dynamicGraphics);
      }
    }
  }

  private drawDiamond(
    x: number,
    y: number,
    color: number,
    alpha: number,
    graphics: Phaser.GameObjects.Graphics = this.staticGraphics!
  ): void {
    if (!graphics) return;
    const halfWidth = this.tilemap.tileWidth / 2;
    const halfHeight = this.tilemap.tileHeight / 2;
    graphics.fillStyle(color, alpha);
    graphics.lineStyle(1, color, 0.75);
    graphics.beginPath();
    graphics.moveTo(x, y - halfHeight);
    graphics.lineTo(x + halfWidth, y);
    graphics.lineTo(x, y + halfHeight);
    graphics.lineTo(x - halfWidth, y);
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();
  }

  private drawDirectedEdge(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    color: number,
    alpha: number,
    graphics: Phaser.GameObjects.Graphics = this.staticGraphics!
  ): void {
    if (!graphics) return;
    const edgeStartX = Phaser.Math.Linear(fromX, toX, 0.28);
    const edgeStartY = Phaser.Math.Linear(fromY, toY, 0.28);
    const edgeEndX = Phaser.Math.Linear(fromX, toX, 0.44);
    const edgeEndY = Phaser.Math.Linear(fromY, toY, 0.44);
    graphics.lineStyle(2, color, alpha);
    graphics.lineBetween(edgeStartX, edgeStartY, edgeEndX, edgeEndY);
    graphics.fillStyle(color, alpha);
    graphics.fillCircle(edgeEndX, edgeEndY, 2.5);
  }

  private addLabel(x: number, y: number, text: string): void {
    const label = this.labels.find((candidate) => !candidate.visible) ?? this.createLabel();
    label.setPosition(x, y);
    label.setText(text);
    label.setOrigin(0.5, 0.5);
    label.setDepth(10_000_001);
    label.setVisible(true);
  }

  private createLabel(): Phaser.GameObjects.Text {
    const label = this.scene.add.text(0, 0, "", {
      color: "#ffffff",
      fontFamily: "disposabledroid",
      fontSize: "10px",
      resolution: 2,
      stroke: "#000000",
      strokeThickness: 2
    });
    label.setVisible(false);
    this.labels.push(label);
    return label;
  }

  private clear(options: { destroyLabels?: boolean } = {}): void {
    this.staticGraphics?.destroy();
    this.staticGraphics = undefined;
    this.dynamicGraphics?.destroy();
    this.dynamicGraphics = undefined;
    if (options.destroyLabels) {
      this.labels.forEach((label) => label.destroy());
      this.labels = [];
    } else {
      this.clearLabels();
    }
    this.stopRedrawTimer();
    this.lastDynamicRedrawAt = 0;
    this.lastStaticRedrawAt = 0;
    this.lastCameraSignature = "";
  }

  private clearLabels(): void {
    if (this.labels.length < LABEL_POOL_MIN_SIZE) {
      // Pool labels so toggling the overlay does not churn text objects.
      while (this.labels.length < LABEL_POOL_MIN_SIZE) {
        this.createLabel();
      }
    }
    this.labels.forEach((label) => {
      label.setVisible(false);
      label.setText("");
    });
  }

  private getCameraSignature(): string {
    const worldView = this.scene.cameras.main.worldView;
    const zoom = this.scene.cameras.main.zoom;
    return `${Math.round(worldView.x)}:${Math.round(worldView.y)}:${Math.round(worldView.width)}:${Math.round(worldView.height)}:${zoom.toFixed(2)}`;
  }

  private getExpandedVisibleWorldBounds(): Phaser.Geom.Rectangle {
    const worldView = this.scene.cameras.main.worldView;
    const paddingX = this.tilemap.tileWidth * CAMERA_CULL_PADDING_TILES;
    const paddingY = this.tilemap.tileHeight * CAMERA_CULL_PADDING_TILES;
    return new Phaser.Geom.Rectangle(
      worldView.x - paddingX,
      worldView.y - paddingY,
      worldView.width + paddingX * 2,
      worldView.height + paddingY * 2
    );
  }

  private getLabelViewportBounds(): Phaser.Geom.Rectangle {
    const worldView = this.scene.cameras.main.worldView;
    return new Phaser.Geom.Rectangle(worldView.x, worldView.y, worldView.width, worldView.height);
  }

  private getVisibleTileBounds(cells: ReadonlyArray<ReadonlyArray<unknown>>): {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  } {
    const worldView = this.scene.cameras.main.worldView;
    // Convert the visible camera rectangle back into tile space so redraws are
    // limited to the currently visible slice of the map.
    const corners = [
      IsoHelper.isometricWorldToTileXY(this.scene, worldView.left, worldView.top),
      IsoHelper.isometricWorldToTileXY(this.scene, worldView.right, worldView.top),
      IsoHelper.isometricWorldToTileXY(this.scene, worldView.left, worldView.bottom),
      IsoHelper.isometricWorldToTileXY(this.scene, worldView.right, worldView.bottom)
    ];
    const lastRowIndex = Math.max(0, cells.length - 1);
    const lastColumnIndex = Math.max(0, Math.max(...cells.map((row) => row.length - 1)));
    const minX = Math.max(0, Math.min(...corners.map((corner) => corner.x)) - CAMERA_CULL_PADDING_TILES);
    const maxX = Math.min(lastColumnIndex, Math.max(...corners.map((corner) => corner.x)) + CAMERA_CULL_PADDING_TILES);
    const minY = Math.max(0, Math.min(...corners.map((corner) => corner.y)) - CAMERA_CULL_PADDING_TILES);
    const maxY = Math.min(lastRowIndex, Math.max(...corners.map((corner) => corner.y)) + CAMERA_CULL_PADDING_TILES);
    return { minX, maxX, minY, maxY };
  }

  private destroy(): void {
    this.scene.events.off(NavigationService.UpdateNavigationEvent, this.handleNavigationUpdated, this);
    this.clear({ destroyLabels: true });
  }

  private getTileCenter(tileX: number, tileY: number): { x: number; y: number } | undefined {
    if (tileX < 0 || tileY < 0 || tileX >= this.tilemap.width || tileY >= this.tilemap.height) return undefined;
    const key = tileY * this.tilemap.width + tileX;
    const cached = this.tileCenterCache.get(key);
    if (cached) return cached;
    const world = IsoHelper.isometricTileToWorldXY(this.scene, tileX, tileY);
    this.tileCenterCache.set(key, world);
    return world;
  }
}
