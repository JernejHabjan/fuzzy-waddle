import { type AfterViewInit, Component, ElementRef, inject, Input, ViewChild } from "@angular/core";

import { AtlasService } from "../../services/atlas/atlas.service";

@Component({
  selector: "fuzzy-waddle-atlas-sprite",
  standalone: true,
  template: ` <canvas #canvas [width]="width" [height]="height"></canvas> `,
  styles: [
    `
      canvas {
        display: block;
      }
    `
  ]
})
export class AtlasSpriteComponent implements AfterViewInit {
  @Input() spriteName!: string;
  @Input() width: number = 32;
  @Input() height: number = 32;

  @ViewChild("canvas") canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;

  private readonly atlasService = inject(AtlasService);

  async ngAfterViewInit() {
    this.initCanvas();
    await this.renderSprite();
  }

  private initCanvas() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext("2d")!;
  }

  private async renderSprite() {
    if (!this.spriteName) return;

    const frame = await this.atlasService.getSpriteFrame(this.spriteName);
    if (!frame) {
      console.warn(`Sprite not found: ${this.spriteName}`);
      return;
    }

    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Draw the sprite from atlas to canvas with proper scaling
    this.ctx.drawImage(this.atlasService.atlasImage, frame.x, frame.y, frame.w, frame.h, 0, 0, this.width, this.height);
  }
}
