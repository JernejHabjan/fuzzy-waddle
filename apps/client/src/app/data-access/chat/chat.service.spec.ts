import { TestBed } from "@angular/core/testing";
import { ChatService } from "./chat.service";
import { AuthenticatedSocketService } from "./authenticated-socket.service";
import { createAuthenticatedSocketServiceStub } from "./authenticated-socket.service.stub";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";

describe("Chat", () => {
  let service: ChatService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ChatService,
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthenticatedSocketService,
          useValue: createAuthenticatedSocketServiceStub
        }
      ]
    });
    service = TestBed.inject(ChatService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
