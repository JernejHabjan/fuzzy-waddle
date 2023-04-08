import { Module } from '@nestjs/common';
import { GameInstanceController } from './game-instance/game-instance.controller';
import { GameInstanceService } from './game-instance/game-instance.service';

@Module({
  providers: [GameInstanceService],
  controllers: [GameInstanceController]
})
export class LittleMuncherModule {}
