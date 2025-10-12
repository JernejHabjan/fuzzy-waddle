import { TestBed } from "@angular/core/testing";
import { AuthService } from "../../../auth/auth.service";
import { authServiceStub } from "../../../auth/auth.service.stub";
import { AudioAtlasService } from "../audio-atlas/audio-atlas.service";
import { audioAtlasServiceStub } from "../audio-atlas/audio-atlas.service.stub";
import { AchievementService } from "./achievement.service";

describe("AchievementService", () => {
  let service: AchievementService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceStub },
        { provide: AudioAtlasService, useValue: audioAtlasServiceStub }
      ]
    });
    service = TestBed.inject(AchievementService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
