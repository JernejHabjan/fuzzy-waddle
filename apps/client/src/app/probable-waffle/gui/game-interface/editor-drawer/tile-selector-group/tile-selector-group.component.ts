import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { TileAtlasFrame, TileFrame } from "../atlas-loader.service";

@Component({
  selector: "fuzzy-waddle-tile-selector-group",
  templateUrl: "./tile-selector-group.component.html",
  styleUrls: ["./tile-selector-group.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TileSelectorGroupComponent {
  @Input({ required: true }) tileAtlasFrames: TileAtlasFrame[] | null = null;
  @Input({ required: true }) selectedTile: number | null = null;
  @Input({ required: true }) frameWithMetaFilter: (tileFrame: TileFrame) => boolean = () => true;

  getFiltered(tileFrame: TileFrame[]): TileFrame[] {
    return tileFrame.filter((frameWithMeta) => this.frameWithMetaFilter(frameWithMeta));
  }
}
