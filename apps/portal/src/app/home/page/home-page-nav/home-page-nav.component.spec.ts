import { ComponentFixture, TestBed } from "@angular/core/testing";
import { HomePageNavComponent } from "./home-page-nav.component";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { provideRouter } from "@angular/router";
import { Component } from "@angular/core";

@Component({ selector: "fuzzy-waddle-home-page-nav", template: "", standalone: true, imports: [] })
export class HomePageNavTestingComponent {}

describe("HomePageNavComponent", () => {
  let component: HomePageNavComponent;
  let fixture: ComponentFixture<HomePageNavComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePageNavComponent, FontAwesomeTestingModule],
      providers: [provideRouter([])]
    })
      .overrideComponent(HomePageNavComponent, {
        remove: {
          imports: [HomePageNavComponent]
        },
        add: {
          imports: [HomePageNavTestingComponent]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(HomePageNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
