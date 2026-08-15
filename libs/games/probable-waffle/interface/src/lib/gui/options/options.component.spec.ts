import { ComponentFixture, TestBed } from "@angular/core/testing";

import { OptionsComponent } from "./options.component";
import { ActivatedRoute } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { provideHttpClient } from "@angular/common/http";
import { AuthService } from "@fuzzy-waddle/platform-identity/client/auth/auth.service";
import { BehaviorSubject } from "rxjs";

describe("OptionsComponent", () => {
  let component: OptionsComponent;
  let fixture: ComponentFixture<OptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        { provide: ActivatedRoute, useValue: {} },
        provideHttpClient(),
        {
          provide: AuthService,
          useValue: {
            sessionChanges: new BehaviorSubject(null),
            ensureAuthReady: () => Promise.resolve(null),
            isAuthenticated: false
          }
        }
      ],
      imports: [OptionsComponent, FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(OptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("renders the approved preference controls", () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector("#automaticallySaveReplays")).not.toBeNull();
    expect(element.querySelector("#profanityFilter")).not.toBeNull();
    expect(element.querySelector("#defaultCameraDistance")).not.toBeNull();
    expect(element.querySelector("#defaultSinglePlayerSpeed")).not.toBeNull();
    expect(element.textContent).toContain("Show actions per minute");
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
