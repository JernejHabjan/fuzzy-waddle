import { Test, TestingModule } from '@nestjs/testing';
import { GameStateServerService } from './game-state-server.service';

describe('GameStateServerService', () => {
  let service: GameStateServerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameStateServerService],
    }).compile();

    service = module.get<GameStateServerService>(GameStateServerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
