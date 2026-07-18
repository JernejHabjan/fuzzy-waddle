import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LoaderComponent } from "./loader.component";

describe("LoaderComponent", () => {
  let fixture: ComponentFixture<LoaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoaderComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(LoaderComponent);
  });

  it("renders the loader element", () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector(".loader")).not.toBeNull();
  });
});
