import { Container, Service, type UseCase } from '@/shared/index.ts';
import UserNotFoundError from '../../domain/UserNotFoundError.ts';
import { UserMapper } from '../../mappers/UserMapper.ts';
import UserRepo from '../../repos/UserRepo.ts';

@Service()
export default class Me implements UseCase<string, Promise<any>> {
  constructor(private userRepo: UserRepo = Container.get(UserRepo)) {}

  async execute(userId: string): Promise<any> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new UserNotFoundError();
    }
    return UserMapper.toDTO(user);
  }
}
