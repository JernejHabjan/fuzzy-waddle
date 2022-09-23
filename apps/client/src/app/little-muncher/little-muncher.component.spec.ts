import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LittleMuncherComponent } from './little-muncher.component';

describe('LittleMuncherComponent', () => {
  let component: LittleMuncherComponent;
  let fixture: ComponentFixture<LittleMuncherComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LittleMuncherComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(LittleMuncherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
