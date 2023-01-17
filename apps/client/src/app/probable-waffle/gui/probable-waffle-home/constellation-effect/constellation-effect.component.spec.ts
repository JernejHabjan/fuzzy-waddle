import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConstellationEffectComponent } from './constellation-effect.component';

describe('ConstellationEffectComponent', () => {
  let component: ConstellationEffectComponent;
  let fixture: ComponentFixture<ConstellationEffectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConstellationEffectComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ConstellationEffectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
