/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app/app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import csurf from 'csurf';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  const port = process.env.PORT || 3333;
  app.useGlobalPipes(new ValidationPipe());

  if (process.env.NODE_ENV === 'development') {
    // swagger setup
    const config = new DocumentBuilder()
      .setTitle('Fuzzy waddle API')
      .setDescription('This API helps you manage fuzzy waddle data!')
      .setVersion('1.0')
      .addTag('calendar')
      .addBearerAuth({ in: 'header', type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
    // navigate to /docs to see the swagger docs
  }

  app.enableCors({
    origin: process.env.CORS_ORIGIN
  });
  // https://docs.nestjs.com/security/helmet
  app.use(helmet());
  // https://docs.nestjs.com/security/csrf
  app.use(csurf());

  await app.listen(port);
  Logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`);
}

bootstrap();
