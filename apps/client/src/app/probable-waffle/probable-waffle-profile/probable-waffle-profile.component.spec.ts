import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProbableWaffleProfileComponent } from './probable-waffle-profile.component';

describe('ProbableWaffleProfileComponent', () => {
  let component: ProbableWaffleProfileComponent;
  let fixture: ComponentFixture<ProbableWaffleProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProbableWaffleProfileComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ProbableWaffleProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
