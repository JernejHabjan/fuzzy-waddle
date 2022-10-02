import { Component, Input } from '@angular/core';
import { SceneCommunicatorService } from '../../../event-emitters/scene-communicator.service';
import { FrameWithMeta } from '../atlas-loader.service';

@Component({
  selector: 'fuzzy-waddle-tile-selector',
  templateUrl: './tile-selector.component.html',
  styleUrls: ['./tile-selector.component.scss']
})
export class TileSelectorComponent {
  @Input() frameWithMeta!: FrameWithMeta;
  @Input() tileId!: number;
  src = 'assets/probable-waffle/atlas/iso-64x64-outside.png';

  selectTile() {
    SceneCommunicatorService.tileEmitterSubject.next(this.tileId);
  }
}
