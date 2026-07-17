import { type AfterViewInit, Component, ElementRef, inject, input, viewChild } from "@angular/core";

import { AtlasService } from "../../services/atlas/atlas.service";

@Component({
  selector: "fuzzy-waddle-atlas-sprite",
  standalone: true,
  template: ` <canvas #canvas [width]="width()" [height]="height()"></canvas> `,
  styles: [
    `
      canvas {
        display: block;
      }
    `
  ]
})
export class AtlasSpriteComponent implements AfterViewInit {
  readonly spriteName = input.required<string>();
  readonly width = input<number>(32);
  readonly height = input<number>(32);

  readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>("canvas");

  private ctx!: CanvasRenderingContext2D;

  private readonly atlasService = inject(AtlasService);

  async ngAfterViewInit() {
    this.initCanvas();
    await this.renderSprite();
  }

  private initCanvas() {
    const canvas = this.canvasRef().nativeElement;
    this.ctx = canvas.getContext("2d")!;
  }

  private async renderSprite() {
    const spriteName = this.spriteName();
    if (!spriteName) return;

    const frame = await this.atlasService.getSpriteFrame(spriteName);
    if (!frame) {
      console.warn(`Sprite not found: ${spriteName}`);
      return;
    }

    // Clear canvas
    const width = this.width();
    const height = this.height();
    this.ctx.clearRect(0, 0, width, height);

    // Draw the sprite from atlas to canvas with proper scaling
    this.ctx.drawImage(this.atlasService.atlasImage, frame.x, frame.y, frame.w, frame.h, 0, 0, width, height);
  }
}
