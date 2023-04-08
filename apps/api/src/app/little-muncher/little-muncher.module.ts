import { Module } from '@nestjs/common';
import { GameInstanceController } from './game-instance/game-instance.controller';
import { GameInstanceService } from './game-instance/game-instance.service';
import { GameInstanceGateway } from './game-instance/game-instance.gateway';

@Module({
  providers: [GameInstanceService, GameInstanceGateway],
  controllers: [GameInstanceController]
})
export class LittleMuncherModule {}
