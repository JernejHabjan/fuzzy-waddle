import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
  // health endpoint always returns OK used for monitoring for zero downtime deploys
  @Get("health")
  getHealth(): string {
    return "OK";
  }
}
