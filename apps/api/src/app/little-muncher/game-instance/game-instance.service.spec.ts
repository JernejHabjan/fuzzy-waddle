import { Test, TestingModule } from '@nestjs/testing';
import { GameInstanceService } from './game-instance.service';

describe('GameInstanceService', () => {
  let service: GameInstanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameInstanceService]
    }).compile();

    service = module.get<GameInstanceService>(GameInstanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
