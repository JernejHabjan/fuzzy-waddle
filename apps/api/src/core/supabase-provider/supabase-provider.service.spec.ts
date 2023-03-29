import { Test, TestingModule } from '@nestjs/testing';
import { SupabaseProviderService } from './supabase-provider.service';

describe('SupabaseProviderService', () => {
  let service: SupabaseProviderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SupabaseProviderService],
    }).compile();

    service = module.get<SupabaseProviderService>(SupabaseProviderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
