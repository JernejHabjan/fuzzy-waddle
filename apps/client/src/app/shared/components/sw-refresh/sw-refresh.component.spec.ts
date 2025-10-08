import { ComponentFixture, TestBed } from "@angular/core/testing";
import { SwRefreshComponent } from "./sw-refresh.component";
import { Component } from "@angular/core";
import { VersionService } from "./version.service";
import { versionServiceStub } from "./version.service.stub";

@Component({ selector: "fuzzy-waddle-sw-refresh", template: "", standalone: true, imports: [] })
export class SwRefreshTestingComponent {}

describe("SwRefreshComponent", () => {
  let component: SwRefreshComponent;
  let fixture: ComponentFixture<SwRefreshComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SwRefreshComponent],
      providers: [
        {
          provide: VersionService,
          useValue: versionServiceStub
        }
      ]
    });
    fixture = TestBed.createComponent(SwRefreshComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
