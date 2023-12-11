import { TestBed } from "@angular/core/testing";
import { ChatService } from "./chat.service";
import { AuthenticatedSocketService } from "./authenticated-socket.service";
import { createAuthenticatedSocketServiceStub } from "./authenticated-socket.service.spec";
import { ChatMessage } from "@fuzzy-waddle/api-interfaces";
import { IChatService } from "./chat.service.interface";
import { AuthService } from "../../auth/auth.service";
import { authServiceStub } from "../../auth/auth.service.spec";
import { Observable } from "rxjs";

export const chatServiceStub = {
  sendMessage(msg: ChatMessage) {
    // do nothing
  },
  getMessage() {
    return new Observable<ChatMessage>();
  },
  createMessage(message: string): ChatMessage {
    return {
      text: message,
      userId: "123",
      fullName: "test",
      createdAt: new Date()
    };
  }
} satisfies IChatService;

describe("Chat", () => {
  let service: ChatService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ChatService,
        {
          provide: AuthenticatedSocketService,
          useValue: createAuthenticatedSocketServiceStub
        },
        { provide: AuthService, useValue: authServiceStub }
      ]
    });
    service = TestBed.inject(ChatService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
