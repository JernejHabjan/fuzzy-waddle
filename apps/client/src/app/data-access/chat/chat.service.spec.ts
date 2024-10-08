import { TestBed } from "@angular/core/testing";
import { ChatService } from "./chat.service";
import { AuthenticatedSocketService } from "./authenticated-socket.service";
import { createAuthenticatedSocketServiceStub } from "./authenticated-socket.service.spec";
import { ChatMessage } from "@fuzzy-waddle/api-interfaces";
import { IChatService } from "./chat.service.interface";
import { Observable } from "rxjs";

export const chatServiceStub = {
  sendMessage(msg: ChatMessage): Promise<void> {
    return Promise.resolve();
  },
  getMessageListener(): Promise<Observable<ChatMessage> | undefined> {
    return Promise.resolve(undefined);
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
        }
      ]
    });
    service = TestBed.inject(ChatService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
