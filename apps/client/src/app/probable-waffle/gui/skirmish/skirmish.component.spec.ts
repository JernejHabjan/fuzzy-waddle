import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SkirmishComponent } from './skirmish.component';
import { RouterTestingModule } from '@angular/router/testing';

describe('SkirmishComponent', () => {
  let component: SkirmishComponent;
  let fixture: ComponentFixture<SkirmishComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SkirmishComponent],
      imports: [RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(SkirmishComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
