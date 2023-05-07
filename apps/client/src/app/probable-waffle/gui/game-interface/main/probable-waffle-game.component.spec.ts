import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProbableWaffleGameComponent } from './probable-waffle-game.component';
import { GameContainerTestingComponent } from '../../../../shared/game/game-container/game-container.component.spec';
import { EditorDrawerTestingComponent } from '../editor-drawer/editor-drawer.component.spec';
import { SelectionGroupTestingComponent } from '../selection/selection-group/selection-group.component.spec';

jest.mock('../../../game/world/const/game-config', () => ({
  probableWaffleGameConfig: {}
}));

describe('ProbableWaffleGameComponent', () => {
  let component: ProbableWaffleGameComponent;
  let fixture: ComponentFixture<ProbableWaffleGameComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        ProbableWaffleGameComponent,
        GameContainerTestingComponent,
        EditorDrawerTestingComponent,
        SelectionGroupTestingComponent
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProbableWaffleGameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
