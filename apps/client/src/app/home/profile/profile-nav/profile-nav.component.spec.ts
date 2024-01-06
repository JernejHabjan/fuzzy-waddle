import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ProfileNavComponent } from "./profile-nav.component";
import { provideRouter } from "@angular/router";
import { Component } from "@angular/core";
import { HomeNavTestingComponent } from "../../../shared/components/home-nav/home-nav.component.spec";
import { CommonModule } from "@angular/common";
import { HomeNavComponent } from "../../../shared/components/home-nav/home-nav.component";
import { RouterTestingModule } from "@angular/router/testing";

@Component({ selector: "fuzzy-waddle-profile-nav", template: "", standalone: true, imports: [CommonModule] })
export class ProfileNavTestingComponent {}

describe("ProfileNavComponent", () => {
  let component: ProfileNavComponent;
  let fixture: ComponentFixture<ProfileNavComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileNavComponent, RouterTestingModule],
      providers: [provideRouter([])]
    })
      .overrideComponent(ProfileNavComponent, {
        remove: {
          imports: [HomeNavComponent]
        },
        add: {
          imports: [HomeNavTestingComponent]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(ProfileNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
