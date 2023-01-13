import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProbableWaffleGameModeDefinitionComponent } from './probable-waffle-game-mode-definition.component';

describe('ProbableWaffleGameModeDefinitionComponent', () => {
  let component: ProbableWaffleGameModeDefinitionComponent;
  let fixture: ComponentFixture<ProbableWaffleGameModeDefinitionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProbableWaffleGameModeDefinitionComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ProbableWaffleGameModeDefinitionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
