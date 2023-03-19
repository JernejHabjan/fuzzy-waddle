import { TestBed } from '@angular/core/testing';

import { ChatService } from './chat.service';
import { SocketIoConfig, SocketIoModule } from 'ngx-socket-io';

// https://stackoverflow.com/a/68708618/5909875
const config: SocketIoConfig = {
  url: 'http://localhost:3005',
  options: { transports: ['websocket'], reconnection: true }
};

describe('Chat', () => {
  let service: ChatService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [SocketIoModule.forRoot(config)] });
    service = TestBed.inject(ChatService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
