import { type AtlasServiceInterface } from "./atlas.service.interface";

export const atlasServiceStub = {
  atlasImage: new Image(),
  getSpriteFrame(): Promise<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null> {
    return Promise.resolve({ x: 0, y: 0, w: 32, h: 32 });
  }
} satisfies AtlasServiceInterface;
