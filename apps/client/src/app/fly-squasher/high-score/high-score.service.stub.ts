import { type HighScoreServiceInterface } from "./high-score.service.interface";

export const highScoreServiceStub = {
  postScore: () => {
    return Promise.resolve();
  },
  getScores: () => Promise.resolve([])
} satisfies HighScoreServiceInterface;
