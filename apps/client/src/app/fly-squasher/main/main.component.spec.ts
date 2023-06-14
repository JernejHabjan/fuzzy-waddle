import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainComponent } from './main.component';
import { GameContainerTestingComponent } from '../../shared/game/game-container/game-container.component.spec';
import { AuthService } from '../../auth/auth.service';
import { authServiceStub } from '../../auth/auth.service.spec';

jest.mock('../game/const/game-config', () => ({
  flySquasherGameConfig: {}
}));

describe('MainComponent', () => {
  let component: MainComponent;
  let fixture: ComponentFixture<MainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MainComponent, GameContainerTestingComponent],
      providers: [{ provide: AuthService, useValue: authServiceStub }]
    }).compileComponents();

    fixture = TestBed.createComponent(MainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
