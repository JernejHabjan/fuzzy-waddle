import { Controller, Get } from '@nestjs/common';
import { Message } from '@fuzzy-waddle/api-interfaces';

import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('hello')
  getData(): Message {
    return this.appService.getData();
  }

  // health endpoint always returns OK used for monitoring for zero downtime deploys
  @Get('health')
  getHealth(): string {
    return 'OK';
  }
}
