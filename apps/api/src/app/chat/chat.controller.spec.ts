import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { chatServiceStub } from './chat.service.spec';
import { ChatController, MessageDto } from './chat.controller';

describe('ChatController', () => {
  let app: TestingModule;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [{ provide: ChatService, useValue: chatServiceStub }]
    }).compile();
  });

  describe('postMessage', () => {
    it('should return void', async () => {
      const chatController = app.get<ChatController>(ChatController);
      const result = await chatController.postMessage({ message: 'test' } as MessageDto);
      expect(result).toBeUndefined();
    });
  });
});
