import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ChatService } from "./chat.service";
import { SupabaseAuthGuard } from "../../auth/guards/supabase-auth.guard";
import { CurrentUser } from "../../auth/current-user";
import { AuthUser } from "@supabase/supabase-js";
import { MessageDto } from "./message.dto";

@Controller()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}
  @Post("message")
  @UseGuards(SupabaseAuthGuard)
  async postMessage(@CurrentUser() user: AuthUser, @Body() body: MessageDto): Promise<void> {
    await this.chatService.postMessage(body.message, user);
  }
}
