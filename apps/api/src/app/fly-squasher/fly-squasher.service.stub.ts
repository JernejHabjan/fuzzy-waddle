import { FlySquasherServiceInterface } from "./fly-squasher.service.interface";

export const flySquasherServiceStub = {
  postScore: () => {},
  getScores: () => {}
} satisfies FlySquasherServiceInterface;
