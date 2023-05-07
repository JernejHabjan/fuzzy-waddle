import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TileFrame } from '../atlas-loader.service';
import { SceneCommunicatorService } from '../../../../communicators/scene-communicator.service';

@Component({
  selector: 'fuzzy-waddle-tile-selector',
  templateUrl: './tile-selector.component.html',
  styleUrls: ['./tile-selector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TileSelectorComponent {
  @Input({ required: true }) frameWithMeta!: TileFrame;
  @Input({ required: true }) selectedTile: number | null = null;
  @Input({ required: true }) textureName!: string;

  selectTile() {
    SceneCommunicatorService.tileEmitterSubject.next(this.frameWithMeta.id);
  }
}
