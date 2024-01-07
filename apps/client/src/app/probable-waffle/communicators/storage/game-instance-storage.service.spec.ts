import { TestBed } from "@angular/core/testing";

import { GameInstanceStorageService } from "./game-instance-storage.service";
import { GameInstanceStorageServiceInterface } from "./game-instance-storage.service.interface";
import { ProbableWaffleGameInstanceSaveData } from "@fuzzy-waddle/api-interfaces";

export const gameInstanceStorageServiceStub = {
  async saveToStorage(gameInstance: ProbableWaffleGameInstanceSaveData): Promise<void> {
    return Promise.resolve();
  },
  async getFromStorage(): Promise<ProbableWaffleGameInstanceSaveData[]> {
    return Promise.resolve([]);
  },
  async deleteFromStorage(gameInstanceSaveData: ProbableWaffleGameInstanceSaveData): Promise<void> {
    return Promise.resolve();
  }
} satisfies GameInstanceStorageServiceInterface;
describe("GameInstanceStorageService", () => {
  let service: GameInstanceStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameInstanceStorageService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
