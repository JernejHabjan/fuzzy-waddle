import { Injectable } from '@nestjs/common';
import { Message } from '@fuzzy-waddle/api-interfaces';
import { IAppService } from './app.service.interface';

@Injectable()
export class AppService implements IAppService {
  getData(): Message {
    return { message: 'Welcome to api!' };
  }
}
