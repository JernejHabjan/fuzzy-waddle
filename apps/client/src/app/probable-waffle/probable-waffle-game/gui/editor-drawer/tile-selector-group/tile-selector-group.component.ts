import { Component, Input, OnInit } from '@angular/core';
import { AtlasFrameWithMeta, FrameWithMeta } from '../atlas-loader.service';

@Component({
  selector: 'fuzzy-waddle-tile-selector-group',
  templateUrl: './tile-selector-group.component.html',
  styleUrls: ['./tile-selector-group.component.scss']
})
export class TileSelectorGroupComponent {
  @Input() atlasFrames: AtlasFrameWithMeta[] | null = null;

  @Input() frameWithMetaFilter: (framesWithMeta: FrameWithMeta) => boolean = () => true;

  getFiltered(framesWithMeta: FrameWithMeta[]): FrameWithMeta[] {
    return framesWithMeta.filter((frameWithMeta) => this.frameWithMetaFilter(frameWithMeta));
  }
}
