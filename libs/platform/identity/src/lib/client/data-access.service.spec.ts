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
    window.sessionStorage.removeItem("fuzzy-waddle:multiplayer-e2e-auth-v1");
  });
  afterEach(() => window.sessionStorage.removeItem("fuzzy-waddle:multiplayer-e2e-auth-v1"));

  it("should be created", () => {
    service = TestBed.inject(DataAccessService);
    expect(service).toBeTruthy();
  });

  it("uses PKCE so OAuth callbacks do not expose session tokens", () => {
    service = TestBed.inject(DataAccessService);
    expect(createClientMock).toHaveBeenCalledWith(environment.supabase.url, environment.supabase.key, {
      auth: {
        flowType: "pkce"
      }
    });
  });

  it("uses a local public Supabase key only for the isolated development multiplayer harness", () => {
    window.sessionStorage.setItem("fuzzy-waddle:multiplayer-e2e-auth-v1", JSON.stringify({
      schemaVersion: 1, url: "http://127.0.0.1:54321", publicAnonKey: "sb_publishable_local_test"
    }));
    service = TestBed.inject(DataAccessService);
    expect(createClientMock).toHaveBeenCalledWith("http://127.0.0.1:54321", "sb_publishable_local_test", {
      auth: { flowType: "pkce" }
    });
  });

  it("rejects a remote test override and retains the normal environment", () => {
    window.sessionStorage.setItem("fuzzy-waddle:multiplayer-e2e-auth-v1", JSON.stringify({
      schemaVersion: 1, url: "https://example.com", publicAnonKey: "sb_publishable_remote_test"
    }));
    service = TestBed.inject(DataAccessService);
    expect(createClientMock).toHaveBeenCalledWith(environment.supabase.url, environment.supabase.key, {
      auth: { flowType: "pkce" }
    });
  });
});
