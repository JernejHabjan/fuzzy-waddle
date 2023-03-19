import { TestBed } from '@angular/core/testing';

import { ChatService } from './chat.service';
import {SocketIoConfig, SocketIoModule} from 'ngx-socket-io';
import { environment } from '../../../environments/environment';

const config: SocketIoConfig = { url: 'http://localhost:3005', options: {} };

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
