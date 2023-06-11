import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameInterfaceComponent } from './game-interface.component';
import { ModalTestComponent } from '../../../shared/components/modal/modal.component.spec';
import { Component } from '@angular/core';

@Component({ selector: 'fly-squasher-game-interface', template: '' })
export class GameInterfaceTestingComponent {}

describe('GameInterfaceComponent', () => {
  let component: GameInterfaceComponent;
  let fixture: ComponentFixture<GameInterfaceComponent>;

  beforeEach(async () => {
    // provide also WrapPipe
    await TestBed.configureTestingModule({
      declarations: [GameInterfaceComponent, ModalTestComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(GameInterfaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
