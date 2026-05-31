import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ChatComponent } from "./chat.component";
import { FormsModule } from "@angular/forms";
import { AvatarProviderService } from "./avatar-provider/avatar-provider.service";
import { avatarProviderServiceStub } from "./avatar-provider/avatar-provider.service.stub";
import { AuthService } from "../../../auth/auth.service";
import { authServiceStub } from "../../../auth/auth.service.stub";
import { ChatService } from "../../../data-access/chat/chat.service";
import { Subject } from "rxjs";
import { provideRouter } from "@angular/router";

const chatServiceStub = {
  getMessages: () => Promise.resolve({ messages: [], total: 0, hasMore: false }),
  reportMessage: () => Promise.resolve()
};

describe("ChatComponent", () => {
  let component: ChatComponent;
  let fixture: ComponentFixture<ChatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AvatarProviderService,
          useValue: avatarProviderServiceStub
        },
        {
          provide: AuthService,
          useValue: authServiceStub
        },
        {
          provide: ChatService,
          useValue: chatServiceStub
        }
      ],
      imports: [ChatComponent, FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("messageListener", new Subject());
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
