import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TileFrame } from '../atlas-loader.service';
import { SceneCommunicatorService } from '../../../event-emitters/scene-communicator.service';

@Component({
  selector: 'fuzzy-waddle-tile-selector',
  templateUrl: './tile-selector.component.html',
  styleUrls: ['./tile-selector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TileSelectorComponent {
  @Input() frameWithMeta!: TileFrame;
  @Input() selectedTile: number | null = null;
  @Input() textureName!: string;

  selectTile() {
    SceneCommunicatorService.tileEmitterSubject.next(this.frameWithMeta.id);
  }
}
