import { TestBed } from "@angular/core/testing";

import { GameInstanceLocalStorageService } from "./game-instance-local-storage.service";
import { GameInstanceStorageServiceInterface } from "./game-instance-storage.service.interface";
import { ProbableWaffleGameInstanceSaveData } from "@fuzzy-waddle/api-interfaces";

export const gameInstanceLocalStorageServiceStub = {
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
describe("GameInstanceLocalStorageService", () => {
  let service: GameInstanceLocalStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameInstanceLocalStorageService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
