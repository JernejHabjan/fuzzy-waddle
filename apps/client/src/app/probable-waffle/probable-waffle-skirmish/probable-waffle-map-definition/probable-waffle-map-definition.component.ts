import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { MapInfo } from '../../probable-waffle-game/scenes/scenes';
import { MapPlayerDefinition } from '../probable-waffle-skirmish.component';

@Component({
  selector: 'fuzzy-waddle-probable-waffle-map-definition',
  templateUrl: './probable-waffle-map-definition.component.html',
  styleUrls: ['./probable-waffle-map-definition.component.scss']
})
export class ProbableWaffleMapDefinitionComponent {
  @ViewChild('canvas')
  get canvas(): ElementRef | undefined {
    return this._canvas;
  }

  set canvas(value: ElementRef | undefined) {
    this._canvas = value;
    this.renderMapWithStartPositions();
  }
  @Input()
  get mapPlayerDefinition(): MapPlayerDefinition | undefined {
    return this._mapPlayerDefinition;
  }

  set mapPlayerDefinition(value: MapPlayerDefinition | undefined) {
    this._mapPlayerDefinition = value;
    this.renderMapWithStartPositions();
  }
  private _canvas?: ElementRef;
  private _mapPlayerDefinition?: MapPlayerDefinition;

  renderMapWithStartPositions() {
    if (!this.mapPlayerDefinition || !this.canvas) {
      return;
    }
    const canvas = this.canvas.nativeElement as HTMLCanvasElement;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // load image
    const img = new Image();
    img.src = 'assets/probable-waffle/maps/icons/' + this.mapPlayerDefinition.map.image;
    img.onload = () => {
      // clamp image to canvas
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
      const x = canvas.width / 2 - (img.width / 2) * scale;
      const y = canvas.height / 2 - (img.height / 2) * scale;
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      const mapPlayerDefinition = this.mapPlayerDefinition as MapPlayerDefinition;
      const map = mapPlayerDefinition.map;
      const mapWidth = map.mapWidth;
      const mapHeight = map.mapHeight;
      map.startPositions.forEach((startPosition, index) => {
        const startPositionX = startPosition.tileXY.x;
        const startPositionY = startPosition.tileXY.y;
        const startPositionZ = startPosition.z;

        // convert to isometric coordinates
        const imageTileHeight = img.height / mapHeight;
        const imageTileWidth = img.width / mapWidth;

        const isoXTileXY = ((startPositionX - startPositionY) * imageTileWidth) / 2;
        const isoYTileXY = ((startPositionX + startPositionY) * imageTileHeight) / 2 - startPositionZ * imageTileHeight;

        const worldWidthHalf = (mapWidth * imageTileWidth) / 2;
        const worldHeightHalf = (mapHeight * imageTileHeight) / 2;

        const isoWorldX = worldWidthHalf + isoXTileXY + imageTileWidth / 2;
        const isoWorldY = isoYTileXY;

        const isoX = isoWorldX * scale + x;
        const isoY = isoWorldY * scale + y;
        this.drawStartPosition(ctx, isoX, isoY, index, mapPlayerDefinition);
      });
    };
  }

  private drawStartPosition(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    index: number,
    mapPlayerDefinition: MapPlayerDefinition
  ) {
    const playerIndex = mapPlayerDefinition.startPositionPerPlayer[index];
    const color = playerIndex === -1 ? 'white' : 'green';
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    if (playerIndex !== -1) {
      ctx.fillText((index + 1).toString(), x, y + 5);
    }

    // register click event
    const fn = (event: MouseEvent) => {
      const rect = ctx.canvas.getBoundingClientRect();
      const newX = event.clientX - rect.left;
      const newY = event.clientY - rect.top;
      const distance = Math.sqrt(Math.pow(newX - x, 2) + Math.pow(newY - y, 2));
      if (distance < 10) {
        if (playerIndex === -1) {
          // assign player
          mapPlayerDefinition.startPositionPerPlayer[index] = index;
          ctx.canvas.removeEventListener('click', fn);
          this.renderMapWithStartPositions();
        } else {
          // unassign player
          mapPlayerDefinition.startPositionPerPlayer[index] = -1;
          ctx.canvas.removeEventListener('click', fn);
          this.renderMapWithStartPositions();
        }
      }
    };

    ctx.canvas.addEventListener('click', fn);
  }
}
