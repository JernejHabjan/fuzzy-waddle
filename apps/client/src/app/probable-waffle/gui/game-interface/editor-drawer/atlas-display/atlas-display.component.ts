import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { AtlasFrame } from "../atlas-loader.service";

@Component({
  selector: "fuzzy-waddle-atlas-display",
  templateUrl: "./atlas-display.component.html",
  styleUrls: ["./atlas-display.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AtlasDisplayComponent {
  displaySize = 64;
  @Input({ required: true }) atlasFrame!: AtlasFrame;
  src: string | null = null;

  private _textureName!: string;

  @Input({ required: true })
  set textureName(value: string) {
    this._textureName = value;
    this.src = `assets/probable-waffle/atlas/${this._textureName}.png`;
  }

  get fileName(): string {
    let fileName = this.atlasFrame.filename;
    if (fileName.includes(".")) {
      // remove extension
      fileName = this.atlasFrame.filename.split(".").slice(0, -1).join(".");
    }

    fileName = fileName.replace(/[_-]/g, " ");

    return fileName;
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
