import { ComponentFixture, TestBed } from "@angular/core/testing";
import { InstantGameComponent } from "./instant-game.component";

describe("InstantGameComponent", () => {
  let component: InstantGameComponent;
  let fixture: ComponentFixture<InstantGameComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstantGameComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(InstantGameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
