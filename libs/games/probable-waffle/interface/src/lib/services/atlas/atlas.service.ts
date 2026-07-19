import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { type AtlasServiceInterface } from "./atlas.service.interface";

@Injectable({
  providedIn: "root"
})
export class AtlasService implements AtlasServiceInterface {
  atlasData: any;
  atlasImage = new Image();

  atlasLoaded = false;
  private loadingPromise: Promise<void> | null = null;

  private readonly http = inject(HttpClient);

  private loadAtlas(): Promise<void> {
    if (this.atlasLoaded) {
      return Promise.resolve();
    }

    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = firstValueFrom(this.http.get("/assets/probable-waffle/atlas/gui.json")).then((data) => {
      this.atlasData = data;
      this.atlasImage.src = "/assets/probable-waffle/atlas/gui.png";

      return new Promise<void>((resolve) => {
        this.atlasImage.onload = () => {
          this.atlasLoaded = true;
          resolve();
        };
      });
    });

    return this.loadingPromise;
  }

  async getSpriteFrame(name: string): Promise<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null> {
    if (!this.atlasLoaded) {
      await this.loadAtlas();
    }

    if (!this.atlasData) return null;

    // Find the frame in the atlas textures
    for (const texture of this.atlasData.textures) {
      const frame = texture.frames.find((f: any) => f.filename === name);
      if (frame) {
        return frame.frame;
      }
    }

    return null;
  }
}
