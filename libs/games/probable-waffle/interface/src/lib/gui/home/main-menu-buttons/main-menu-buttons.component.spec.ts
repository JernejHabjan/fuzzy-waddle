import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MainMenuButtonsComponent } from "./main-menu-buttons.component";
import { ActivatedRoute } from "@angular/router";
import { signal } from "@angular/core";
import { TauriService } from "@fuzzy-waddle/platform-game-host/angular/services/tauri.service";
import { AuthService } from "@fuzzy-waddle/platform-identity/client/auth/auth.service";
import { AvatarProviderService } from "@fuzzy-waddle/platform-identity/client/avatar-provider/avatar-provider.service";

describe("MainMenuButtonsComponent", () => {
  let component: MainMenuButtonsComponent;
  let fixture: ComponentFixture<MainMenuButtonsComponent>;
  const isDesktopSignInPending = signal(false);
  const authService = {
    processing: null,
    isAuthenticated: false,
    isDesktopSignInPending,
    signInWithGoogle: jest.fn(),
    cancelSignIn: jest.fn(() => isDesktopSignInPending.set(false))
  };

  beforeEach(async () => {
    isDesktopSignInPending.set(false);
    authService.signInWithGoogle.mockClear();
    authService.cancelSignIn.mockClear();

    await TestBed.configureTestingModule({
      imports: [MainMenuButtonsComponent],
      providers: [
        { provide: ActivatedRoute, useValue: {} },
        {
          provide: TauriService,
          useValue: {
            isTauri: true,
            getAppVersion: jest.fn().mockResolvedValue("0.1.1"),
            quit: jest.fn()
          }
        },
        { provide: AuthService, useValue: authService },
        { provide: AvatarProviderService, useValue: { getAvatar: jest.fn() } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MainMenuButtonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("replaces the desktop sign-in button with a cancel action while OAuth is pending", () => {
    isDesktopSignInPending.set(true);
    fixture.detectChanges();

    const cancelButton = Array.from(fixture.nativeElement.querySelectorAll("button") as NodeListOf<HTMLButtonElement>).find(
      (button) => button.textContent?.includes("Cancel Sign In")
    );
    expect(cancelButton).toBeTruthy();

    cancelButton?.click();
    expect(authService.cancelSignIn).toHaveBeenCalled();

    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain("Sign In");
  });
});
