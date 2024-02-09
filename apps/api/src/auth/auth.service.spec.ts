import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { IAuthService } from "./auth.service.interface";
import { AuthUser } from "@supabase/supabase-js";

export const authUserStub: AuthUser = {
  user_metadata: undefined,
  id: undefined,
  app_metadata: {
    provider: undefined
  },
  aud: undefined,
  confirmation_sent_at: undefined,
  confirmed_at: undefined,
  created_at: undefined,
  email: undefined,
  last_sign_in_at: undefined,
  role: undefined
};

export const authServiceStub = {
  validateTest(): Promise<boolean> {
    return Promise.resolve(true);
  }
} satisfies IAuthService;

describe("AuthService", () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService]
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
