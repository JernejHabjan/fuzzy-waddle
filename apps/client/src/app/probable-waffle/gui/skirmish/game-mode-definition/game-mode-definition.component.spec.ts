import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameModeDefinitionComponent } from './game-mode-definition.component';

describe('GameModeDefinitionComponent', () => {
  let component: GameModeDefinitionComponent;
  let fixture: ComponentFixture<GameModeDefinitionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GameModeDefinitionComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(GameModeDefinitionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
