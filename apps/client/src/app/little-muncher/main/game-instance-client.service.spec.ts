import { TestBed } from '@angular/core/testing';

import { GameInstanceClientService } from './game-instance-client.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { GameInstanceClientServiceInterface } from './game-instance-client.service.interface';

export const gameInstanceClientServiceStub = {
  get gameInstanceId(): string | null {
    return null;
  },
  startGame(): Promise<void> {
    return Promise.resolve();
  },
  stopGame() {
    //
  },
  startLevel() {
    //
  },
  openLevelSpectator() {
    //
  },
  openLevel() {
    //
  },
  stopLevel(): Promise<void> {
    return Promise.resolve();
  }
} as GameInstanceClientServiceInterface;
describe('GameInstanceClientService', () => {
  let service: GameInstanceClientService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(GameInstanceClientService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
