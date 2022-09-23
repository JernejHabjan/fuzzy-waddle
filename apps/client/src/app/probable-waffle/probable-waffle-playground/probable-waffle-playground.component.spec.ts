import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProbableWafflePlaygroundComponent } from './probable-waffle-playground.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('ProbableWafflePlaygroundComponent', () => {
  let component: ProbableWafflePlaygroundComponent;
  let fixture: ComponentFixture<ProbableWafflePlaygroundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProbableWafflePlaygroundComponent],
      imports: [HttpClientTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(ProbableWafflePlaygroundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
