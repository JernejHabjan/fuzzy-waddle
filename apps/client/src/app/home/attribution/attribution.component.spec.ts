import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AttributionComponent } from "./attribution.component";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";

describe("AttributionComponent", () => {
  let component: AttributionComponent;
  let fixture: ComponentFixture<AttributionComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
      imports: [AttributionComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(AttributionComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should fetch and display attributions", () => {
    const mockAttributions = [
      {
        type: "voice-acting",
        name: "Test123",
        url: "test.com"
      }
    ];

    fixture.detectChanges();

    const req = httpMock.expectOne("assets/general/attributions.json");
    expect(req.request.method).toBe("GET");
    req.flush(mockAttributions);

    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.querySelector("h2 a").textContent).toContain("Test123");
  });
});
