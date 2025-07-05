import { User } from "./users.service";
import { IUsersService } from "./users.service.interface";

export const usersServiceStub = {
  findOne(): Promise<User> {
    return Promise.resolve(null);
  }
} satisfies IUsersService;
