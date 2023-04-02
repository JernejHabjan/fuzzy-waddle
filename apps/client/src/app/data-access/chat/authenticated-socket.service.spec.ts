import { TestBed } from '@angular/core/testing';
import { AuthenticatedSocketService } from './authenticated-socket.service';
import { IAuthenticatedSocketService } from './authenticated-socket.service.interface';
import { Socket } from 'ngx-socket-io';

export const createAuthenticatedSocketServiceStub = {
  createAuthSocket: () => {
    return {
      emit: () => {
        //
      },
      fromEvent: () => {
        //
      }
    } as any as Socket;
  }
} as IAuthenticatedSocketService;

describe('AuthenticatedSocketService', () => {
  let service: AuthenticatedSocketService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthenticatedSocketService]
    });
    service = TestBed.inject(AuthenticatedSocketService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
