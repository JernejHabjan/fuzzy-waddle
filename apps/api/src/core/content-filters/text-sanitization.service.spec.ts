import { Test, TestingModule } from '@nestjs/testing';
import { TextSanitizationService } from './text-sanitization.service';

describe('TextSanitizationService', () => {
  let service: TextSanitizationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TextSanitizationService],
    }).compile();

    service = module.get<TextSanitizationService>(TextSanitizationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
