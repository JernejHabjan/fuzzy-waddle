import { TestBed } from "@angular/core/testing";
import { createClient } from "@supabase/supabase-js";

import { DataAccessService } from "./data-access.service";
import { environment } from "@fuzzy-waddle/environments/environment";

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn()
}));

describe("DataAccess", () => {
  let service: DataAccessService;
  const createClientMock = createClient as jest.MockedFunction<typeof createClient>;

  beforeEach(() => {
    createClientMock.mockReturnValue({} as ReturnType<typeof createClient>);
    TestBed.configureTestingModule({ providers: [DataAccessService] });
    service = TestBed.inject(DataAccessService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("uses PKCE so OAuth callbacks do not expose session tokens", () => {
    expect(createClientMock).toHaveBeenCalledWith(environment.supabase.url, environment.supabase.key, {
      auth: {
        flowType: "pkce"
      }
    });
  });
});
