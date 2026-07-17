import { LittleMuncherHighScoreServiceInterface } from "./little-muncher-high-score.service.interface";
import { LittleMuncherScoreDto } from "@fuzzy-waddle/little-muncher-protocol";

export const mockHighScoreServiceStub = {
  postScore: () => {
    return Promise.resolve();
  },
  getScores: (): Promise<LittleMuncherScoreDto[]> => {
    return Promise.resolve([] satisfies LittleMuncherScoreDto[]);
  }
} satisfies LittleMuncherHighScoreServiceInterface;
