import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameModeDefinitionComponent } from './game-mode-definition.component';
import { FormsModule } from '@angular/forms';
import { Component } from '@angular/core';

@Component({ selector: 'fuzzy-waddle-game-mode-definition', template: '' })
export class GameModeDefinitionTestingComponent {}

describe('GameModeDefinitionComponent', () => {
  let component: GameModeDefinitionComponent;
  let fixture: ComponentFixture<GameModeDefinitionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GameModeDefinitionComponent],
      imports: [FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(GameModeDefinitionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
