import { AtlasServiceInterface } from "./atlas.service.interface";

export const atlasServiceStub = {
  getSpriteFrame(): Promise<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null> {
    return Promise.resolve(null);
  }
} satisfies AtlasServiceInterface;
