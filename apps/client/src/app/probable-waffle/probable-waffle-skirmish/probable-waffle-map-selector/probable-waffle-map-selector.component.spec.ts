import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProbableWaffleMapSelectorComponent } from './probable-waffle-map-selector.component';

describe('ProbableWaffleMapSelectorComponent', () => {
  let component: ProbableWaffleMapSelectorComponent;
  let fixture: ComponentFixture<ProbableWaffleMapSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProbableWaffleMapSelectorComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ProbableWaffleMapSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
