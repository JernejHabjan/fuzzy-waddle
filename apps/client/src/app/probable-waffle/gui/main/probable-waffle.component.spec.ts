import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProbableWaffleComponent } from './probable-waffle.component';
import { RouterTestingModule } from '@angular/router/testing';

describe('ProbableWaffleComponent', () => {
  let component: ProbableWaffleComponent;
  let fixture: ComponentFixture<ProbableWaffleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProbableWaffleComponent],
      imports: [RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(ProbableWaffleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
