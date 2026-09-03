/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
// eslint-disable-next-line @nx/enforce-module-boundaries
import packageJson from "../../../package.json";

import { AppModule } from "./app/app.module";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import type { NestExpressApplication } from "@nestjs/platform-express";
import helmet from "helmet";

async function bootstrap() {
  // Typed as NestExpressApplication (instead of the default INestApplication) because
  // `useBodyParser` is an Express-platform-only API; it isn't available on the generic interface.
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const globalPrefix = "api";
  app.setGlobalPrefix(globalPrefix);
  const port = process.env.PORT || 3333;
  app.useGlobalPipes(new ValidationPipe());
  // Express/body-parser defaults to a 100kb request body limit, which is too small for some
  // payloads (e.g. probable-waffle game/campaign save documents posted to
  // POST /api/probable-waffle/game-saves, see GameSaveController). Raise it explicitly here
  // instead of silently rejecting large requests; keep this limit in sync with any endpoint that
  // expects large bodies.
  app.useBodyParser("json", { limit: "5mb" });
  app.useBodyParser("urlencoded", { limit: "5mb", extended: true });

  if (process.env.NODE_ENV === "development") {
    // swagger setup
    const config = new DocumentBuilder()
      .setTitle("Fuzzy waddle API")
      .setDescription("This API helps you manage fuzzy waddle data!")
      .setVersion("1.0")
      .addBearerAuth({ in: "header", type: "http", scheme: "bearer", bearerFormat: "JWT" }, "access-token")
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("docs", app, document);
    // navigate to /docs to see the swagger docs
  }

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(",")
  });
  // https://docs.nestjs.com/security/helmet
  app.use(helmet());

  await app.listen(port);
  Logger.log(`📦 Fuzzy Waddle API version: ${packageJson.version}`);
  Logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`);
}

bootstrap();
