import { type User } from "./users.service";
import { type IUsersService } from "./users.service.interface";

export const usersServiceStub = {
  findOne(): Promise<User> {
    return Promise.resolve(null);
  }
} satisfies IUsersService;
