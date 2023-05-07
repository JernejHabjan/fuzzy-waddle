import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameInterfaceComponent } from './game-interface.component';
import { GameInstanceClientService } from '../game-instance-client.service';
import { gameInstanceClientServiceStub } from '../game-instance-client.service.spec';
import { LittleMuncherGameInstance } from '@fuzzy-waddle/api-interfaces';
import { ModalTestComponent } from '../../../shared/components/modal/modal.component.spec';
import { Component } from '@angular/core';

@Component({ selector: 'fuzzy-waddle-game-interface', template: '' })
export class GameInterfaceTestingComponent {}

describe('GameInterfaceComponent', () => {
  let component: GameInterfaceComponent;
  let fixture: ComponentFixture<GameInterfaceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GameInterfaceComponent, ModalTestComponent],
      providers: [{ provide: GameInstanceClientService, useValue: gameInstanceClientServiceStub }]
    }).compileComponents();

    fixture = TestBed.createComponent(GameInterfaceComponent);
    component = fixture.componentInstance;

    // set empty game instance
    const gameInstanceClientService = fixture.debugElement.injector.get(GameInstanceClientService);
    gameInstanceClientService.gameInstance = new LittleMuncherGameInstance();

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
