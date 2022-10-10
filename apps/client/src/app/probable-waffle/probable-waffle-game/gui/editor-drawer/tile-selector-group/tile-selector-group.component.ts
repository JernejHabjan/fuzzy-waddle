import { Component, Input } from '@angular/core';
import { TileAtlasFrame, TileFrame } from '../atlas-loader.service';

@Component({
  selector: 'fuzzy-waddle-tile-selector-group',
  templateUrl: './tile-selector-group.component.html',
  styleUrls: ['./tile-selector-group.component.scss']
})
export class TileSelectorGroupComponent {
  @Input() tileAtlasFrames: TileAtlasFrame[] | null = null;

  @Input() frameWithMetaFilter: (tileFrame: TileFrame) => boolean = () => true;

  getFiltered(tileFrame: TileFrame[]): TileFrame[] {
    return tileFrame.filter((frameWithMeta) => this.frameWithMetaFilter(frameWithMeta));
  }
}
