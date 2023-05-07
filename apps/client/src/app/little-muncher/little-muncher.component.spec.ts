import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LittleMuncherComponent } from './little-muncher.component';
import { GameInstanceClientService } from './main/game-instance-client.service';
import { gameInstanceClientServiceStub } from './main/game-instance-client.service.spec';
import { SpectateService } from './home/spectate/spectate.service';
import { spectateServiceStub } from './home/spectate/spectate.service.spec';
import { FontAwesomeTestingModule } from '@fortawesome/angular-fontawesome/testing';

describe('LittleMuncherComponent', () => {
  let component: LittleMuncherComponent;
  let fixture: ComponentFixture<LittleMuncherComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LittleMuncherComponent],
      imports: [FontAwesomeTestingModule],
      providers: [
        { provide: GameInstanceClientService, useValue: gameInstanceClientServiceStub },
        { provide: SpectateService, useValue: spectateServiceStub }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LittleMuncherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
