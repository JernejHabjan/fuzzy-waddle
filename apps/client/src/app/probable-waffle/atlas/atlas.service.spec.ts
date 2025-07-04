import { TestBed } from "@angular/core/testing";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { AtlasService } from "./atlas.service";
import { provideHttpClient } from "@angular/common/http";

export const atlasServiceStub = {
  getSpriteFrame(): Promise<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null> {
    return null;
  }
} satisfies AtlasServiceInterface;

describe("AtlasService", () => {
  let service: AtlasService;
  let httpMock: HttpTestingController;

  const mockAtlasData = {
    textures: [
      {
        image: "gui.png",
        frames: [
          {
            filename: "test/sprite.png",
            frame: { x: 10, y: 20, w: 30, h: 40 },
            sourceSize: { w: 32, h: 32 }
          }
        ]
      }
    ]
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AtlasService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should get a sprite frame", async () => {
    service.atlasData = mockAtlasData;

    const frame = service.getSpriteFrame("test/sprite.png");

    expect(frame).toEqual({ x: 10, y: 20, w: 30, h: 40 });
  });

  it("should return null for non-existent sprite frames", () => {
    service.atlasData = mockAtlasData;

    const frame = service.getSpriteFrame("non-existent.png");

    expect(frame).toBeNull();
  });
});
