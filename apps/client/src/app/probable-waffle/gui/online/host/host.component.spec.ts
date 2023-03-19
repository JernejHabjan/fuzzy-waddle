import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HostComponent } from './host.component';
import { SkirmishTestingComponent } from '../../skirmish/skirmish.component.spec';

describe('HostComponent', () => {
  let component: HostComponent;
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HostComponent, SkirmishTestingComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
