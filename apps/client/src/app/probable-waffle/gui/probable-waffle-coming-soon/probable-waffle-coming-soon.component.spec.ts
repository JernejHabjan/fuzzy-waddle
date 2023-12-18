import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ProbableWaffleComingSoonComponent } from "./probable-waffle-coming-soon.component";

describe("ProbableWaffleComingSoonComponent", () => {
  let component: ProbableWaffleComingSoonComponent;
  let fixture: ComponentFixture<ProbableWaffleComingSoonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProbableWaffleComingSoonComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ProbableWaffleComingSoonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
