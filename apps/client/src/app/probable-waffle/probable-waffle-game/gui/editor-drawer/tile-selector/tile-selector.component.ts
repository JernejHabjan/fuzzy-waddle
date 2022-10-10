import { Component, Input } from '@angular/core';
import { SceneCommunicatorService } from '../../../event-emitters/scene-communicator.service';
import { FrameWithMeta } from '../atlas-loader.service';

@Component({
  selector: 'fuzzy-waddle-tile-selector',
  templateUrl: './tile-selector.component.html',
  styleUrls: ['./tile-selector.component.scss']
})
export class TileSelectorComponent {
  @Input()
  set textureName(value: string) {
    this._textureName = value;
    this.src = `assets/probable-waffle/atlas/${this._textureName}.png`;
  }
  @Input() frameWithMeta!: FrameWithMeta;
  @Input() tileId!: number;
  private _textureName!: string;
  src: string | null = null;
  get fileName(): string {
    // "remove extension"
    return this.frameWithMeta.filename.split('.').slice(0, -1).join('.');
  }

  selectTile() {
    SceneCommunicatorService.tileEmitterSubject.next(this.tileId);
  }
}
