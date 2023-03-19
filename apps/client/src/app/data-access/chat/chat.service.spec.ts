import { TestBed } from '@angular/core/testing';

import { ChatService } from './chat.service';
import { SocketIoModule } from 'ngx-socket-io';
import { environment } from '../../../environments/environment';

describe('Chat', () => {
  let service: ChatService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [SocketIoModule.forRoot(environment.socketIoConfig)] });
    service = TestBed.inject(ChatService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
