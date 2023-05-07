import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpectateComponent } from './spectate.component';
import { SpectateService } from './spectate.service';
import { spectateServiceStub } from './spectate.service.spec';
import { ServerHealthService } from '../../../shared/services/server-health.service';
import { serverHealthServiceStub } from '../../../shared/services/server-health.service.spec';
import { Component } from '@angular/core';

@Component({ selector: 'little-muncher-spectate', template: '' })
export class SpectateTestComponent {}

describe('SpectateComponent', () => {
  let component: SpectateComponent;
  let fixture: ComponentFixture<SpectateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SpectateComponent],
      providers: [
        { provide: ServerHealthService, useValue: serverHealthServiceStub },
        { provide: SpectateService, useValue: spectateServiceStub }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SpectateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
