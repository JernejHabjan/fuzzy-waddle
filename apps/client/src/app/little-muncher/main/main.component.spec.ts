import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainComponent } from './main.component';
import { GameContainerTestingComponent } from '../../shared/game/game-container/game-container.component.spec';
import { GameInstanceClientService } from './game-instance-client.service';
import { gameInstanceClientServiceStub } from './game-instance-client.service.spec';
import { AuthService } from '../../auth/auth.service';
import { authServiceStub } from '../../auth/auth.service.spec';
import { GameInterfaceTestingComponent } from './game-interface/game-interface.component.spec';

jest.mock('../game/const/game-config', () => ({
  littleMuncherGameConfig: {}
}));

describe('MainComponent', () => {
  let component: MainComponent;
  let fixture: ComponentFixture<MainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MainComponent, GameContainerTestingComponent, GameInterfaceTestingComponent],
      providers: [
        { provide: GameInstanceClientService, useValue: gameInstanceClientServiceStub },
        { provide: AuthService, useValue: authServiceStub }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
