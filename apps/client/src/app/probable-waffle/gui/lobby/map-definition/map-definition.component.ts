import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  ViewChild
} from "@angular/core";
import {
  GameSetupHelpers,
  type PlayerLobbyDefinition,
  type PositionPlayerDefinition,
  ProbableWaffleLevels,
  type ProbableWaffleMapData,
  ProbableWafflePlayer,
  type ProbableWafflePlayerDataChangeEventProperty
} from "@fuzzy-waddle/api-interfaces";
import {
  ProbableWaffleCommunicators,
  SceneCommunicatorClientService
} from "../../../communicators/scene-communicator-client.service";
import { Subscription } from "rxjs";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";
import { AuthService } from "../../../../auth/auth.service";

/**
 * canvas element containing info about current player and position.
 * Represented as a rectangle on canvas
 * */
interface DisplayRect {
  playerNumber: number;
  positionNumber: number;
  tileX: number;
  tileY: number;
  worldX: number;
  worldY: number;
  width: number;
  height: number;
  fillNormal: string; // example hsl(0, 100%, 50%)
  fillHover: string; // example hsl(0, 100%, 50%)
  isHovering: boolean;
  isDragging: boolean;
  zIndex: number; // 0 or 1
}

@Component({
  selector: "probable-waffle-map-definition",
  templateUrl: "./map-definition.component.html",
  styleUrls: ["./map-definition.component.scss"]
})
export class MapDefinitionComponent implements OnInit, OnDestroy {
  private readonly preferredCanvasWidth = 400;
  private readonly preferredCanvasHeight = 200;
  protected canvasWidth = this.preferredCanvasWidth;
  protected canvasHeight = this.preferredCanvasHeight;
  private img!: HTMLImageElement;
  // get canvas related references
  private ctx?: CanvasRenderingContext2D;
  private _canvas?: ElementRef;
  private canvasOffsetX!: number;
  private canvasOffsetY!: number;
  private contextWidth!: number;
  private contextHeight!: number;
  private initialized = false;
  // drag related variables
  private currentlyDragging = false;
  private startX = 0;
  private startY = 0;
  private rects: DisplayRect[] = [];
  private rectangleWidth = 30;
  private rectangleHeight = 30;

  private communicators?: ProbableWaffleCommunicators;
  private communicatorSubscriptions: Subscription[] = [];

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly sceneCommunicatorClientService = inject(SceneCommunicatorClientService);
  private readonly gameInstanceClientService = inject(GameInstanceClientService);
  protected readonly authService = inject(AuthService);

  @ViewChild("canvas")
  get canvas(): ElementRef | undefined {
    return this._canvas;
  }

  set canvas(value: ElementRef | undefined) {
    this._canvas = value;
    this.setCanvasSize();
    // noinspection JSIgnoredPromiseFromCall
    this.initialize();
  }

  protected get mapData(): ProbableWaffleMapData | null {
    const mapId = this.gameInstanceClientService.gameInstance?.gameMode?.data.map;
    if (!mapId) return null;
    // noinspection UnnecessaryLocalVariableJS
    const mapData = ProbableWaffleLevels[mapId];
    return mapData;
  }

  private get players(): ProbableWafflePlayer[] {
    return this.gameInstanceClientService.gameInstance?.players ?? [];
  }

  protected get isHost(): boolean {
    return this.gameInstanceClientService.gameInstance?.isHost(this.authService.userId) ?? false;
  }

  ngOnInit(): void {
    this.startListeningToGameInstanceEventsInLobby();
  }

  private startListeningToGameInstanceEventsInLobby() {
    this.communicators = this.sceneCommunicatorClientService.communicatorObservables;
    this.listenToGameInstanceMetadataEvents();
    this.listenToGameModeDataEvents();
    this.listenToPlayerEvents();
  }

  listenToGameInstanceMetadataEvents(): void {
    if (!this.communicators) return;
    this.communicatorSubscriptions.push(
      this.communicators.gameInstanceObservable.subscribe((payload) => {
        this.refresh();
      })
    );
  }

  listenToGameModeDataEvents(): void {
    if (!this.communicators) return;
    this.communicatorSubscriptions.push(
      this.communicators.gameModeObservable.subscribe(async (payload) => {
        switch (payload.property) {
          case "map":
            await this.initializeImage();
            break;
        }
        this.refresh();
      })
    );
  }

  listenToPlayerEvents(): void {
    if (!this.communicators) return;
    this.communicatorSubscriptions.push(
      this.communicators.playerObservable.subscribe((payload) => {
        this.refresh();
      })
    );
  }

  private stopListeningToGameInstanceEventsInLobby() {
    this.communicatorSubscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  ngOnDestroy() {
    this.stopListeningToGameInstanceEventsInLobby();
  }

  // private _mapPlayerDefinition?: MapPlayerDefinition;
  //
  // @Input({ required: true })
  // get mapPlayerDefinition(): MapPlayerDefinition | undefined {
  //   return this._mapPlayerDefinition;
  // }
  //
  // set mapPlayerDefinition(value: MapPlayerDefinition | undefined) {
  //   // check if map changed
  //   if (this._mapPlayerDefinition && value && this._mapPlayerDefinition.map.name !== value.map.name) {
  //     this.reset();
  //   }
  //   this._mapPlayerDefinition = value;
  //   // noinspection JSIgnoredPromiseFromCall
  //   this.initialize();
  // }

  /**
   * returns iso coordinates that correspond with image definitions for selected map definition
   * Meaning that iso coordinates are calculated based on image size and map definition
   */
  private get isoCoordinates(): { x: number; y: number }[] {
    const data = this.getImgDefinitions();
    if (!data) return [];
    const { scale, x, y, width, height } = data;

    const map = this.mapData!;
    const mapWidth = map.mapInfo.widthTiles;
    const mapHeight = map.mapInfo.heightTiles;
    const isoCoordinates: { x: number; y: number }[] = [];
    map.mapInfo.startPositionsOnTile.forEach((startPosition) => {
      const startPositionX = startPosition.x;
      const startPositionY = startPosition.y;
      const startPositionZ = startPosition.z;

      // convert to isometric coordinates
      const imageTileHeight = height / mapHeight;
      const imageTileWidth = width / mapWidth;

      const isoXTileXY = ((startPositionX - startPositionY) * imageTileWidth) / 2;
      const isoYTileXY = ((startPositionX + startPositionY) * imageTileHeight) / 2 - startPositionZ * imageTileHeight;

      const worldWidthHalf = (mapWidth * imageTileWidth) / 2;

      const isoWorldX = worldWidthHalf + isoXTileXY + imageTileWidth / 2;
      const isoWorldY = isoYTileXY;

      const isoX = isoWorldX * scale + x;
      const isoY = isoWorldY * scale + y;

      isoCoordinates.push({ x: isoX, y: isoY });
    });
    return isoCoordinates;
  }

  @HostListener("window:resize", ["$event"])
  onResize() {
    this.refresh();
  }

  private reInitializePlayerPositions() {
    this.rects = [];
    this.initializePlayerPositions();
  }

  refresh() {
    if (!this.initialized) return;
    this.setCanvasSize();
    this.recalculateOffset();
    this.reInitializePlayerPositions();
    this.draw();
  }

  /**
   * create draggable rectangles for each player currently joined on the map
   */
  private initializePlayerPositions() {
    // an array of objects that define different rectangles
    if (!this.mapData) {
      return;
    }
    const isoCoordinates = this.isoCoordinates;

    let i = -1;
    for (const positionForPlayer of this.players) {
      const definition = positionForPlayer.playerController.data.playerDefinition;
      i++;

      const playerRect = this.rects.find((rect) => rect.playerNumber === definition!.player.playerNumber);
      if (!playerRect) {
        const playerPosition = definition!.player.playerPosition!;
        const isoCoordinate = isoCoordinates[playerPosition];
        const maxPlayers = this.mapData.mapInfo.startPositionsOnTile.length;
        const playerNumber = definition!.player.playerNumber;
        const color = GameSetupHelpers.getStringColorForPlayer(playerNumber, maxPlayers);
        this.createDraggablePlayerRectangle(i, playerPosition, isoCoordinate, color);
      }
    }
  }

  /**
   * redraw the scene
   */
  private draw() {
    this.clear();
    this.drawMapWithStartPositions();
    this.drawPlayerRectangles();
  }

  private setCanvasSize() {
    if (!this.canvas) {
      this.initialize();
      return;
    }
    const margin = 140;
    const canvas = this.canvas.nativeElement as HTMLCanvasElement;
    // if innerWidth is smaller than preferred width, use innerWidth
    if (window.innerWidth - margin < this.preferredCanvasWidth) {
      this.canvasWidth = window.innerWidth - margin;
      // preferred height is 1/2 of width
      this.canvasHeight = this.canvasWidth / 2;
    }
    canvas.width = this.canvasWidth;
    canvas.height = this.canvasHeight;
    this.cdr.detectChanges();
    this.initialize();
  }

  /**
   * initializes canvas and loads new map image
   */
  private async initialize() {
    if (!this.mapData || !this.canvas) {
      return;
    }
    if (this.initialized) {
      // already initialized - just draw
      this.draw();
      return;
    }
    this.initialized = true;
    const canvas = this.canvas.nativeElement as HTMLCanvasElement;
    this.ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

    // get canvas related references
    this.recalculateOffset();
    this.contextWidth = canvas.width;
    this.contextHeight = canvas.height;

    // drag related variables
    this.currentlyDragging = false;
    this.startX = 0;
    this.startY = 0;

    await this.initializeImage();

    this.initializePlayerPositions();

    // listen for mouse events
    canvas.onmousedown = this.myDown.bind(this);
    canvas.onmouseup = this.myUp.bind(this);
    canvas.onmousemove = this.myMove.bind(this);
    canvas.onmouseout = this.myOut.bind(this);
    this.draw();
  }

  private async initializeImage() {
    await this.loadImage();
  }

  /**
   * We need to recalculate offset because canvas might have been moved around
   */
  private recalculateOffset() {
    if (!this.canvas) {
      return;
    }
    const canvas = this.canvas.nativeElement as HTMLCanvasElement;
    const BB = canvas.getBoundingClientRect();
    this.canvasOffsetX = BB.left;
    this.canvasOffsetY = BB.top;
  }

  /**
   * draw load map image
   */
  private loadImage(): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();
      this.img = img;
      img.src = this.mapData!.presentation.imagePath;
      img.onload = () => resolve();
    });
  }

  /**
   * Adds new draggable rectangle
   */
  private createDraggablePlayerRectangle(
    playerNumber: number,
    positionNumber: number,
    isoCoordinate: { x: number; y: number },
    fill: string
  ) {
    const lightenFill = this.lightenColor(fill, 0.3);
    this.rects.push({
      playerNumber,
      positionNumber,
      tileX: isoCoordinate.x,
      tileY: isoCoordinate.y,
      worldX: isoCoordinate.x,
      worldY: isoCoordinate.y,
      width: this.rectangleWidth,
      height: this.rectangleHeight,
      fillNormal: fill,
      fillHover: lightenFill,
      isHovering: false,
      isDragging: false,
      zIndex: 0
    });
  }

  /**
   * color example hsl(0, 100%, 50%)
   * percent in is 0.0 - 1.0
   */
  private lightenColor(color: string, percent: number) {
    const hsl = color.substring(4, color.length - 1).split(",");

    const h = hsl[0];
    const s = hsl[1];
    const l = hsl[2];
    const lPercent = parseFloat(l) + percent * 100;
    return "hsl(" + h + "," + s + "," + lPercent + "%)";
  }

  /**
   * draw a single rect
   */
  private rect(x: number, y: number, w: number, h: number, fill: string) {
    if (!this.ctx) return;
    this.ctx.fillStyle = fill;
    this.ctx.beginPath();

    // draw a circle instead of rectangle
    this.ctx.arc(x, y, w / 2, 0, Math.PI * 2, true);
    // this.ctx.rect(x, y, w, h);
    this.ctx.closePath();
    this.ctx.fill();
  }

  /**
   * clear the canvas
   */
  private clear() {
    this.ctx?.clearRect(0, 0, this.contextWidth, this.contextHeight);
  }

  /**
   * draw s all player rectangles where z-index is taken into account, so drag and drop works properly
   */
  private drawPlayerRectangles() {
    // redraw each rect in the rects[] array
    // sort by zIndex
    this.rects.sort((a, b) => a.zIndex - b.zIndex);
    for (let i = 0; i < this.rects.length; i++) {
      const r = this.rects[i];
      this.rect(r.worldX, r.worldY, r.width, r.height, r.isHovering ? r.fillHover : r.fillNormal);
    }
  }

  /**
   * checks for hovering rectangles on canvas and marks them with isHovering
   */
  private myOver(e: MouseEvent) {
    this.recalculateOffset();
    // lighten the rect if the mouse is inside
    // get the current mouse position
    const mx = e.clientX - this.canvasOffsetX;
    const my = e.clientY - this.canvasOffsetY;

    // test each rect to see if mouse is inside
    for (let i = 0; i < this.rects.length; i++) {
      const r = this.rects[i];
      const previousIsHovering = r.isHovering;

      r.isHovering = this.intersects({ x: mx, y: my }, { x: r.worldX, y: r.worldY, width: r.width, height: r.height });
      if (previousIsHovering !== r.isHovering) {
        this.draw();
      }
    }
  }

  /**
   * check if we clicked on any draggable rectangle - if yes, set isDragging to true
   */
  private myDown(e: MouseEvent) {
    // Only allow host to drag and reposition players
    if (!this.isHost) return;

    this.recalculateOffset();
    // tell the browser we're handling this mouse event
    e.preventDefault();
    e.stopPropagation();

    this.currentlyDragging = false;

    // get the current mouse position
    const mx = e.clientX - this.canvasOffsetX;
    const my = e.clientY - this.canvasOffsetY;

    this.rects.forEach((r) => {
      r.zIndex = 0;
    });
    const rectangles = this.getIntersectedRectangles(e);
    rectangles.forEach((r) => {
      r.isDragging = true;
      // set z index to 1
      r.zIndex = 1;
    });
    this.currentlyDragging = rectangles.length > 0;

    // save the current mouse position
    this.startX = mx;
    this.startY = my;
  }

  /**
   * returns all rectangles that are intersected by the mouse event
   */
  private getIntersectedRectangles(e: MouseEvent): DisplayRect[] {
    this.recalculateOffset();
    // get the current mouse position
    const mx = e.clientX - this.canvasOffsetX;
    const my = e.clientY - this.canvasOffsetY;

    const intersectedRectangles: DisplayRect[] = [];
    // test each rect to see if mouse is inside
    for (let i = 0; i < this.rects.length; i++) {
      const r = this.rects[i];
      const intersects = this.intersects(
        { x: mx, y: my },
        { x: r.worldX, y: r.worldY, width: r.width, height: r.height }
      );
      if (intersects) {
        intersectedRectangles.push(r);
      }
    }
    return intersectedRectangles;
  }

  /**
   * Checks if click intersects with canvas element
   */
  private intersects(
    click: { x: number; y: number },
    second: { x: number; y: number; width: number; height: number }
  ): boolean {
    const rectangleWidthHalf = second.width / 2;
    const rectangleHeightHalf = second.height / 2;
    const rectangleCenterX = second.x;
    const rectangleCenterY = second.y;

    const dx = Math.abs(click.x - rectangleCenterX);
    const dy = Math.abs(click.y - rectangleCenterY);

    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < Math.min(rectangleWidthHalf, rectangleHeightHalf);
  }

  /**
   *  checks if we switched two player positions
   *  checks if we placed player on empty position
   *  checks if we placed player on non-existing-position - just snap back to previous
   *  clears all dragging flags
   */
  private async myUp(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    await this.handleEmptyRectangleOnUp(e);
    await this.handleRectangleSwitchOnUp(e);
    await this.handleRectangleOnEmptyTileUp();
    this.handleRectangleSnappingOnUp();
    this.clearDraggingFlags();
  }

  /**
   * checks if we switched two player positions
   */
  private async handleRectangleSwitchOnUp(e: MouseEvent) {
    const getIntersectedRectangles = this.getIntersectedRectangles(e);
    // get the rectangle that we're dragging
    const draggingRectangle = this.rects.find((r) => r.isDragging);
    // get the rectangle that we're hovering
    const hoveringRectangle = getIntersectedRectangles.find((r) => r.isHovering && !r.isDragging);

    if (draggingRectangle && hoveringRectangle) {
      // swap the rectangle positions
      const prevDraggingX = draggingRectangle.tileX;
      const prevDraggingY = draggingRectangle.tileY;

      draggingRectangle.tileX = hoveringRectangle.tileX;
      draggingRectangle.tileY = hoveringRectangle.tileY;

      hoveringRectangle.tileX = prevDraggingX;
      hoveringRectangle.tileY = prevDraggingY;

      await this.switchPlayerPositions(draggingRectangle, hoveringRectangle);
    }
  }

  /**
   * checks if we switched two player positions
   */
  private async switchPlayerPositions(draggingRectangle: DisplayRect, hoveringRectangle: DisplayRect) {
    const draggingPositionNumber = draggingRectangle.positionNumber;
    const hoveringPositionNumber = hoveringRectangle.positionNumber;

    draggingRectangle.positionNumber = hoveringPositionNumber;
    hoveringRectangle.positionNumber = draggingPositionNumber;

    const draggingPlayer = this.players.find(
      (p) => p.playerController.data.playerDefinition!.player.playerPosition === draggingPositionNumber
    )!;
    const hoveringPlayer = this.players.find(
      (p) => p.playerController.data.playerDefinition!.player.playerPosition === hoveringPositionNumber
    )!;

    await this.emitPlayerPositionChanged(draggingPlayer, hoveringPositionNumber);
    await this.emitPlayerPositionChanged(hoveringPlayer, draggingPositionNumber);

    console.log("player positions changed " + draggingPositionNumber + " " + hoveringPositionNumber);
  }

  /**
   * checks if we placed player on empty position
   */
  private async handleRectangleOnEmptyTileUp() {
    const draggingRectangle = this.rects.find((r) => r.isDragging);

    if (!draggingRectangle) {
      return;
    }

    // check if we're hovering over an empty tile
    const hoveringIsoCoordinate = this.getIsoCoordinateFromWorld(draggingRectangle.worldX, draggingRectangle.worldY);

    if (hoveringIsoCoordinate) {
      const previousTileX = draggingRectangle.tileX;
      const previousTileY = draggingRectangle.tileY;
      draggingRectangle.tileX = hoveringIsoCoordinate.coordinate.x;
      draggingRectangle.tileY = hoveringIsoCoordinate.coordinate.y;

      await this.updatePlayerPosition(
        draggingRectangle,
        { x: previousTileX, y: previousTileY },
        { x: hoveringIsoCoordinate.coordinate.x, y: hoveringIsoCoordinate.coordinate.y }
      );
    }
  }

  /**
   * Returns iso coordinate index from world coordinates
   */
  private getIsoCoordinateFromWorld(
    x: number,
    y: number
  ): {
    coordinate: { x: number; y: number };
    index: number;
  } | null {
    const isoCoordinates = this.isoCoordinates;
    const coordinate =
      isoCoordinates.find((isoCoordinate) => {
        // check if worldX and worldY difference is less than 10
        return Math.abs(isoCoordinate.x - x) < 10 && Math.abs(isoCoordinate.y - y) < 10;
      }) || null;
    if (!coordinate) {
      return null;
    }
    return {
      coordinate,
      index: isoCoordinates.indexOf(coordinate)
    };
  }

  /**
   * checks if we placed player on empty position
   */
  private async updatePlayerPosition(
    draggingRectangle: DisplayRect,
    previousIsoCoordinate: { x: number; y: number },
    newIsoCoordinate: { x: number; y: number }
  ) {
    const isoCoordinates = this.isoCoordinates;

    const newPosition = isoCoordinates.findIndex(
      (isoCoordinate) => isoCoordinate.x === newIsoCoordinate.x && isoCoordinate.y === newIsoCoordinate.y
    );

    const previousPosition = isoCoordinates.findIndex(
      (isoCoordinate) => isoCoordinate.x === previousIsoCoordinate.x && isoCoordinate.y === previousIsoCoordinate.y
    );

    // update map player definition
    const players = this.players;
    const player = players.find(
      (p) => p.playerController.data.playerDefinition!.player.playerPosition === previousPosition
    )!;
    if (!player) throw new Error("Player not found with position " + previousPosition);

    await this.emitPlayerPositionChanged(player, newPosition);
    console.log("Player positions changed", previousPosition, newPosition);
  }

  private async emitPlayerPositionChanged(player: ProbableWafflePlayer, playerPosition: number) {
    await this.gameInstanceClientService.playerChanged(
      "playerController.data.playerDefinition.player.playerPosition" as ProbableWafflePlayerDataChangeEventProperty,
      {
        playerNumber: player.playerNumber,
        playerControllerData: {
          playerDefinition: { player: { playerPosition } as PlayerLobbyDefinition } as PositionPlayerDefinition
        }
      }
    );
  }

  /**
   * checks if we placed player on non-existing-position - just snap back to previous
   */
  private handleRectangleSnappingOnUp() {
    let anySnapped = false;
    this.rects.forEach((r) => {
      const prevWorldX = r.worldX;
      const prevWorldY = r.worldY;
      r.worldX = r.tileX;
      r.worldY = r.tileY;
      if (prevWorldX !== r.worldX || prevWorldY !== r.worldY) {
        anySnapped = true;
      }
    });
    if (anySnapped) {
      this.draw();
    }
  }

  /**
   * Add new A.I. player on empty rectangle click
   */
  private async handleEmptyRectangleOnUp(e: MouseEvent) {
    this.recalculateOffset();
    const getIntersectedRectangles = this.getIntersectedRectangles(e);
    if (getIntersectedRectangles.length) {
      return;
    }

    // get the current mouse position
    const mx = e.clientX - this.canvasOffsetX;
    const my = e.clientY - this.canvasOffsetY;
    const isoCoordinate = this.getIsoCoordinateFromWorld(mx, my);

    // check if any isoCoordinate intersects with the mouse position
    if (!isoCoordinate) {
      return;
    }
    const { index } = isoCoordinate;

    // add new player
    await this.gameInstanceClientService.addAiPlayer(index);
    console.log("AI player added via click on canvas" + index);
  }

  /**
   * clears all dragging flags
   */
  private clearDraggingFlags() {
    // clear all the dragging flags
    this.currentlyDragging = false;
    for (let i = 0; i < this.rects.length; i++) {
      this.rects[i].isDragging = false;
    }
  }

  /**
   * Updates position of draggable rectangle
   */
  private myMove(e: MouseEvent) {
    this.recalculateOffset();
    this.myOver(e);

    // if we're dragging anything...
    if (this.currentlyDragging) {
      // tell the browser we're handling this mouse event
      e.preventDefault();
      e.stopPropagation();

      // get the current mouse position
      const mx = e.clientX - this.canvasOffsetX;
      const my = e.clientY - this.canvasOffsetY;

      // calculate the distance the mouse has moved
      // since the last mousemove
      const dx = mx - this.startX;
      const dy = my - this.startY;

      // move each rect that isDragging
      // by the distance the mouse has moved
      // since the last mousemove
      for (let i = 0; i < this.rects.length; i++) {
        const r = this.rects[i];
        if (r.isDragging) {
          r.worldX += dx;
          r.worldY += dy;
        }
      }

      // redraw the scene with the new rect positions
      this.draw();

      // reset the starting mouse position for the next mousemove
      this.startX = mx;
      this.startY = my;
    }
  }

  /**
   * Makes sure that if canvas is exited, dragging is stopped
   */
  private myOut() {
    this.rects.forEach((r) => {
      r.isHovering = false;
      // snap them to current tile
      r.worldX = r.tileX;
      r.worldY = r.tileY;
    });
    this.clearDraggingFlags();
    this.draw();
  }

  /**
   * gets canvas and image definitions - so image can be rendered on canvas correctly
   */
  private getImgDefinitions() {
    if (!this.canvas) return;
    const canvas = this.canvas.nativeElement as HTMLCanvasElement;
    const img = this.img;

    // clamp image to canvas
    const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
    const x = canvas.width / 2 - (img.width / 2) * scale;
    const y = canvas.height / 2 - (img.height / 2) * scale;
    return { img, scale, x, y, width: img.width, height: img.height };
  }

  /**
   * clamp image to canvas
   */
  private drawMapImage() {
    if (!this.ctx) return;
    const data = this.getImgDefinitions();
    if (!data) return;
    const { img, scale, x, y, width, height } = data;
    this.ctx.drawImage(img, x, y, width * scale, height * scale);
  }

  /**
   * draws blank start positions on map
   */
  private drawMapWithStartPositions() {
    this.drawMapImage();

    const isoCoordinates = this.isoCoordinates;
    isoCoordinates.forEach((isoCoordinate) => this.drawStartPositionSquare(isoCoordinate.x, isoCoordinate.y));
  }

  /**
   * blank start position
   */
  private drawStartPositionSquare(x: number, y: number) {
    this.rect(x, y, this.rectangleWidth, this.rectangleHeight, "white");
  }
}
