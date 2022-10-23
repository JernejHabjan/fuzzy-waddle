import { Component, Input } from '@angular/core';
import { AtlasFrame } from '../atlas-loader.service';

@Component({
  selector: 'fuzzy-waddle-atlas-display',
  templateUrl: './atlas-display.component.html',
  styleUrls: ['./atlas-display.component.scss']
})
export class AtlasDisplayComponent {
  displaySize = 64;
  @Input()
  set textureName(value: string) {
    this._textureName = value;
    this.src = `assets/probable-waffle/atlas/${this._textureName}.png`;
  }
  @Input() atlasFrame!: AtlasFrame;
  private _textureName!: string;
  src: string | null = null;
  get fileName(): string {
    // "remove extension"
    return this.atlasFrame.filename.split('.').slice(0, -1).join('.').replace(/_/g, ' ').replace(/-/g, ' ')
  }

  get scale(): number {
    return Math.min(this.displaySize / this.atlasFrame.frame.w, this.displaySize / this.atlasFrame.frame.h);
  }

  getTranslateX(): number {
    const width = this.atlasFrame.frame.w * this.scale;
    return (this.displaySize - width) / 2;
  }
  getTranslateY(): number {
    const height = this.atlasFrame.frame.h * this.scale;
    return (this.displaySize - height) / 2;
  }
}
