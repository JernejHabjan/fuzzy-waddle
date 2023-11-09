import { TestBed } from '@angular/core/testing';

import { DataAccessService } from './data-access.service';
import { SupabaseClient } from '@supabase/supabase-js';
import { DataAccessServiceInterface } from './data-access.service.interface';

export const dataAccessServiceStub = {
  get supabase(): SupabaseClient {
    return new SupabaseClient('http://localhost:4200', '123');
  }
} satisfies DataAccessServiceInterface;
describe('DataAccess', () => {
  let service: DataAccessService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [{ provide: DataAccessService, useValue: dataAccessServiceStub }] });
    service = TestBed.inject(DataAccessService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
