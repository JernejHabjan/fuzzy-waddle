import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatComponent } from './chat.component';
import { ChatService } from '../../../data-access/chat/chat.service';
import { ChatMessage } from '@fuzzy-waddle/api-interfaces';
import { ChatServiceInterface } from '../../../data-access/chat/chat.service.interface';
import { FormsModule } from '@angular/forms';

describe('ChatComponent', () => {
  let component: ChatComponent;
  let fixture: ComponentFixture<ChatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ChatComponent],
      // for chat service use ChatServiceInterface interface
      providers: [
        {
          provide: ChatService,
          useValue: {
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
          } as ChatServiceInterface
        }
      ],
      imports: [FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
