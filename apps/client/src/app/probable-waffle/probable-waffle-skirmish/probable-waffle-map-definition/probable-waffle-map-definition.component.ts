import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import {
  MapPlayerDefinition,
  PlayerLobbyDefinition,
  PositionPlayerDefinition
} from '../probable-waffle-skirmish.component';

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
  selector: 'fuzzy-waddle-probable-waffle-map-definition',
  templateUrl: './probable-waffle-map-definition.component.html',
  styleUrls: ['./probable-waffle-map-definition.component.scss']
})
export class ProbableWaffleMapDefinitionComponent {
  private img!: HTMLImageElement;
  @ViewChild('canvas')
  get canvas(): ElementRef | undefined {
    return this._canvas;
  }

  set canvas(value: ElementRef | undefined) {
    this._canvas = value;
    // noinspection JSIgnoredPromiseFromCall
    this.initialize();
  }
  @Input()
  get mapPlayerDefinition(): MapPlayerDefinition | undefined {
    return this._mapPlayerDefinition;
  }

  set mapPlayerDefinition(value: MapPlayerDefinition | undefined) {
    // check if map changed
    if (this._mapPlayerDefinition && value && this._mapPlayerDefinition.map.name !== value.map.name) {
      this.reset();
    }
    this._mapPlayerDefinition = value;
    // noinspection JSIgnoredPromiseFromCall
    this.initialize();
  }
  private _canvas?: ElementRef;
  private _mapPlayerDefinition?: MapPlayerDefinition;

  // get canvas related references
  private ctx!: CanvasRenderingContext2D;
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

  /**
   * Called when map changes - reset everything
   */
  private reset() {
    this.initialized = false;
    this.rects = [];
  }

  /**
   * initializes canvas and loads new map image
   */
  private async initialize() {
    if (!this.mapPlayerDefinition || !this.canvas) {
      return;
    }
    if (this.initialized) {
      // already initialized - just draw
      this.draw();
      return;
    }
    this.initialized = true;
    const canvas = this.canvas.nativeElement as HTMLCanvasElement;
    this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

    // get canvas related references
    const BB = canvas.getBoundingClientRect();
    this.canvasOffsetX = BB.left;
    this.canvasOffsetY = BB.top;
    this.contextWidth = canvas.width;
    this.contextHeight = canvas.height;

    // drag related variables
    this.currentlyDragging = false;
    this.startX = 0;
    this.startY = 0;

    await this.loadImage();

    this.initializePlayerPositions();

    // listen for mouse events
    canvas.onmousedown = this.myDown.bind(this);
    canvas.onmouseup = this.myUp.bind(this);
    canvas.onmousemove = this.myMove.bind(this);
    canvas.onmouseout = this.myOut.bind(this);
    this.draw();
  }

  /**
   * draw load map image
   */
  private loadImage(): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();
      this.img = img;
      img.src = 'assets/probable-waffle/maps/icons/' + (this.mapPlayerDefinition as MapPlayerDefinition).map.image;
      img.onload = () => resolve();
    });
  }

  /**
   * create draggable rectangles for each player currently joined on the map
   */
  initializePlayerPositions() {
    // an array of objects that define different rectangles
    if (!this.mapPlayerDefinition) {
      return;
    }
    const isoCoordinates = this.isoCoordinates;

    let i = -1;
    for (const positionForPlayer of this.mapPlayerDefinition.startPositionPerPlayer) {
      i++;
      if (!positionForPlayer.player.joined) {
        continue;
      }

      const player = positionForPlayer.player as PlayerLobbyDefinition;
      const playerRect = this.rects.find((rect) => rect.playerNumber === player.playerNumber);
      if (!playerRect) {
        const playerPosition = player.playerPosition as number;
        const isoCoordinate = isoCoordinates[playerPosition];
        this.createDraggablePlayerRectangle(i, playerPosition, isoCoordinate, positionForPlayer.playerColor);
      }
    }
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
    const lightenFill = this.lightenColor(fill, 0.1);
    this.rects.push({
      playerNumber,
      positionNumber,
      tileX: isoCoordinate.x,
      tileY: isoCoordinate.y,
      worldX: isoCoordinate.x,
      worldY: isoCoordinate.y,
      width: 30,
      height: 30,
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
    const hsl = color.substring(4, color.length - 1).split(',');

    const h = hsl[0];
    const s = hsl[1];
    const l = hsl[2];
    const lPercent = parseFloat(l) + percent * 100;
    return 'hsl(' + h + ',' + s + ',' + lPercent + '%)';
  }

  /**
   * draw a single rect
   */
  private rect(x: number, y: number, w: number, h: number, fill: string) {
    this.ctx.fillStyle = fill;
    this.ctx.beginPath();
    this.ctx.rect(x, y, w, h);
    this.ctx.closePath();
    this.ctx.fill();
  }

  /**
   * clear the canvas
   */
  private clear() {
    this.ctx.clearRect(0, 0, this.contextWidth, this.contextHeight);
  }

  /**
   * redraw the scene
   */
  draw() {
    this.clear();
    this.drawMapWithStartPositions();
    this.drawPlayerRectangles();
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
    // lighten the rect if the mouse is inside
    // get the current mouse position
    const mx = e.clientX - this.canvasOffsetX;
    const my = e.clientY - this.canvasOffsetY;

    // test each rect to see if mouse is inside
    for (let i = 0; i < this.rects.length; i++) {
      const r = this.rects[i];
      const previousIsHovering = r.isHovering;
      r.isHovering = mx > r.worldX && mx < r.worldX + r.width && my > r.worldY && my < r.worldY + r.height;
      if (previousIsHovering !== r.isHovering) {
        this.draw();
      }
    }
  }

  /**
   * check if we clicked on any draggable rectangle - if yes, set isDragging to true
   */
  private myDown(e: MouseEvent) {
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
    // get the current mouse position
    const mx = e.clientX - this.canvasOffsetX;
    const my = e.clientY - this.canvasOffsetY;

    const intersectedRectangles: DisplayRect[] = [];
    // test each rect to see if mouse is inside
    for (let i = 0; i < this.rects.length; i++) {
      const r = this.rects[i];
      if (mx > r.worldX && mx < r.worldX + r.width && my > r.worldY && my < r.worldY + r.height) {
        intersectedRectangles.push(r);
      }
    }
    return intersectedRectangles;
  }

  /**
   *  checks if we switched two player positions
   *  checks if we placed player on empty position
   *  checks if we placed player on non-existing-position - just snap back to previous
   *  clears all dragging flags
   */
  private myUp(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    this.handleRectangleSwitchOnUp(e);
    this.handleRectangleOnEmptyTileUp();
    this.handleRectangleSnappingOnUp();
    this.clearDraggingFlags();
  }

  /**
   * checks if we switched two player positions
   */
  private handleRectangleSwitchOnUp(e: MouseEvent) {
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

      this.switchPlayerPositions(draggingRectangle, hoveringRectangle);
    }
  }

  /**
   * checks if we switched two player positions
   */
  private switchPlayerPositions(draggingRectangle: DisplayRect, hoveringRectangle: DisplayRect) {
    const draggingPositionNumber = draggingRectangle.positionNumber;
    const hoveringPositionNumber = hoveringRectangle.positionNumber;

    draggingRectangle.positionNumber = hoveringPositionNumber;
    hoveringRectangle.positionNumber = draggingPositionNumber;

    const mapPlayerDefinition = this.mapPlayerDefinition as MapPlayerDefinition;
    const draggingPlayer = mapPlayerDefinition.startPositionPerPlayer.find(
      (p) => p.player.playerPosition === draggingPositionNumber
    ) as PositionPlayerDefinition;
    const hoveringPlayer = mapPlayerDefinition.startPositionPerPlayer.find(
      (p) => p.player.playerPosition === hoveringPositionNumber
    ) as PositionPlayerDefinition;

    draggingPlayer.player.playerPosition = hoveringPositionNumber;
    hoveringPlayer.player.playerPosition = draggingPositionNumber;
  }

  /**
   * checks if we placed player on empty position
   */
  private handleRectangleOnEmptyTileUp() {
    const draggingRectangle = this.rects.find((r) => r.isDragging);

    if (!draggingRectangle) {
      return;
    }

    // check if we're hovering over an empty tile
    const isoCoordinates = this.isoCoordinates;
    const hoveringIsoCoordinate = isoCoordinates.find((isoCoordinate) => {
      // check if worldX and worldY difference is less than 10
      return (
        Math.abs(isoCoordinate.x - draggingRectangle.worldX) < 10 &&
        Math.abs(isoCoordinate.y - draggingRectangle.worldY) < 10
      );
    });

    if (hoveringIsoCoordinate) {
      const previousTileX = draggingRectangle.tileX;
      const previousTileY = draggingRectangle.tileY;
      draggingRectangle.tileX = hoveringIsoCoordinate.x;
      draggingRectangle.tileY = hoveringIsoCoordinate.y;

      this.updatePlayerPosition(draggingRectangle, { x: previousTileX, y: previousTileY }, hoveringIsoCoordinate);
    }
  }

  /**
   * checks if we placed player on empty position
   */
  private updatePlayerPosition(
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
    const mapPlayerDefinition = this.mapPlayerDefinition as MapPlayerDefinition;
    const playerDefinition = mapPlayerDefinition.startPositionPerPlayer.find(
      (startPositionPerPlayer) => startPositionPerPlayer?.player.playerPosition === previousPosition
    ) as PositionPlayerDefinition;
    playerDefinition.player.playerPosition = newPosition;

    draggingRectangle.positionNumber = newPosition;
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
    const canvas = (this.canvas as ElementRef).nativeElement as HTMLCanvasElement;
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
    const { img, scale, x, y, width, height } = this.getImgDefinitions();
    this.ctx.drawImage(img, x, y, width * scale, height * scale);
  }

  /**
   * returns iso coordinates that correspond with image definitions for selected map definition
   * Meaning that iso coordinates are calculated based on image size and map definition
   */
  private get isoCoordinates(): { x: number; y: number }[] {
    const { scale, x, y, width, height } = this.getImgDefinitions();

    const mapPlayerDefinition = this.mapPlayerDefinition as MapPlayerDefinition;
    const map = mapPlayerDefinition.map;
    const mapWidth = map.mapWidth;
    const mapHeight = map.mapHeight;
    const isoCoordinates: { x: number; y: number }[] = [];
    map.startPositions.forEach((startPosition) => {
      const startPositionX = startPosition.tileXY.x;
      const startPositionY = startPosition.tileXY.y;
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
    this.rect(x, y, 30, 30, 'white');
  }
}
