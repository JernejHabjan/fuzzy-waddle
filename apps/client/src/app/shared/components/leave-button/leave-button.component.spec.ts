import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LeaveButtonComponent } from "./leave-button.component";
import { ActivatedRoute } from "@angular/router";

describe("LeaveButtonComponent", () => {
  let component: LeaveButtonComponent;
  let fixture: ComponentFixture<LeaveButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeaveButtonComponent],
      providers: [{ provide: ActivatedRoute, useValue: {} }]
    }).compileComponents();

    fixture = TestBed.createComponent(LeaveButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
