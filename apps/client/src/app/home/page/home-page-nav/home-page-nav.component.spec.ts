import { ComponentFixture, TestBed } from "@angular/core/testing";
import { HomePageNavComponent } from "./home-page-nav.component";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { provideRouter } from "@angular/router";
import { Component } from "@angular/core";
import { HomeNavTestingComponent } from "../../../shared/components/home-nav/home-nav.component.spec";
import { CommonModule } from "@angular/common";

@Component({ selector: "probable-waffle-home-page-nav", template: "", standalone: true, imports: [CommonModule] })
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
