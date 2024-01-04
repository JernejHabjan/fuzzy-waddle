import { Test, TestingModule } from '@nestjs/testing';
import { RoomServerService } from './room-server.service';

describe('RoomServerService', () => {
  let service: RoomServerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoomServerService],
    }).compile();

    service = module.get<RoomServerService>(RoomServerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
