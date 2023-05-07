import { TestBed } from '@angular/core/testing';
import { ChatService } from './chat.service';
import { AuthenticatedSocketService } from './authenticated-socket.service';
import { createAuthenticatedSocketServiceStub } from './authenticated-socket.service.spec';
import { ChatMessage } from '@fuzzy-waddle/api-interfaces';
import { IChatService } from './chat.service.interface';

export const chatServiceStub = {
  sendMessage(msg: ChatMessage) {
    // do nothing
  },
  getMessage() {
    return {
      subscribe: () => {
        // do nothing
      }
    };
  },
  createMessage(message: string): ChatMessage {
    return null as unknown as ChatMessage;
  }
} as IChatService;

describe('Chat', () => {
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

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
