export interface AtlasServiceInterface {
  getSpriteFrame(name: string): Promise<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>;
}
