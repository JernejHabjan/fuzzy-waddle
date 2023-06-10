import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlySquasherComponent } from './fly-squasher.component';
import { GameContainerTestingComponent } from '../shared/game/game-container/game-container.component.spec';

jest.mock('./consts/game-config', () => ({
  flySquasherGameConfig: {}
}));
describe('FlySquasherComponent', () => {
  let component: FlySquasherComponent;
  let fixture: ComponentFixture<FlySquasherComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FlySquasherComponent, GameContainerTestingComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FlySquasherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
