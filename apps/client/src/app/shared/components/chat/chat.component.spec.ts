import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ChatComponent } from "./chat.component";
import { FormsModule } from "@angular/forms";
import { AvatarProviderService } from "./avatar-provider/avatar-provider.service";
import { avatarProviderServiceStub } from "./avatar-provider/avatar-provider.service.stub";
import { AuthService } from "../../../auth/auth.service";
import { authServiceStub } from "../../../auth/auth.service.stub";

describe("ChatComponent", () => {
  let component: ChatComponent;
  let fixture: ComponentFixture<ChatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        {
          provide: AvatarProviderService,
          useValue: avatarProviderServiceStub
        },
        {
          provide: AuthService,
          useValue: authServiceStub
        }
      ],
      imports: [ChatComponent, FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
