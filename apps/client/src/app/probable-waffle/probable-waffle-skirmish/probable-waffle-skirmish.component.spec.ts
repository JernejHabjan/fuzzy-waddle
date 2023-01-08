import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProbableWaffleSkirmishComponent } from './probable-waffle-skirmish.component';
import { RouterTestingModule } from '@angular/router/testing';

describe('ProbableWaffleSkirmishComponent', () => {
  let component: ProbableWaffleSkirmishComponent;
  let fixture: ComponentFixture<ProbableWaffleSkirmishComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProbableWaffleSkirmishComponent],
      imports: [RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(ProbableWaffleSkirmishComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
