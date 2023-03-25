import { User } from './users.service';

export interface IUsersService {
  findOne(username: string): Promise<User | undefined>;
}
