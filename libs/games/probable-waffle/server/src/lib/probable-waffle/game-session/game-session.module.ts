import { Module } from "@nestjs/common";
import { GameSessionController } from "./game-session.controller";
import { GameSessionService } from "./game-session.service";
import { AuthModule } from "@fuzzy-waddle/api/auth/auth.module";

@Module({
  controllers: [GameSessionController],
  providers: [GameSessionService],
  imports: [AuthModule],
  exports: [GameSessionService]
})
export class GameSessionModule {}
