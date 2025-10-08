import { type FlySquasherServiceInterface } from "./fly-squasher.service.interface";

export const flySquasherServiceStub = {
  postScore: () => {
    return Promise.resolve();
  },
  getScores: () => {
    return Promise.resolve([]);
  }
} satisfies FlySquasherServiceInterface;
