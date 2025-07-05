import { TestBed } from "@angular/core/testing";

import { AchievementServiceInterface } from "./achievement.service.interface";
import { AchievementDto } from "@fuzzy-waddle/api-interfaces";
import { Observable } from "rxjs";
import { AuthService } from "../../../auth/auth.service";
import { authServiceStub } from "../../../auth/auth.service.spec";
import { AudioAtlasService } from "../../audio-atlas/audio-atlas.service";
import { audioAtlasServiceStub } from "../../audio-atlas/audio-atlas.service.spec";
import { AchievementDefinition } from "./achievement-definition";
import { AchievementService } from "./achievement.service";

export const achievementServiceStub = {
  loadUserAchievements: function (): Promise<AchievementDto[]> {
    return Promise.resolve([]);
  },
  getUserAchievements: function (): Observable<AchievementDto[]> {
    throw new Error("Function not implemented.");
  },
  unlockAchievement: function (): Promise<boolean> {
    throw new Error("Function not implemented.");
  },
  isAchievementUnlocked: function (): boolean {
    throw new Error("Function not implemented.");
  },
  getAchievementDefinitions: function (): AchievementDefinition[] {
    throw new Error("Function not implemented.");
  },
  getAchievementDefinition: function (): AchievementDefinition | null {
    throw new Error("Function not implemented.");
  }
} satisfies AchievementServiceInterface;
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
