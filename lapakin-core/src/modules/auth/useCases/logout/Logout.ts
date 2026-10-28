import { Container, Service, type UseCase } from '@/shared/index.ts';
import RefreshTokenRepo from '../../repos/RefreshTokenRepo.ts';

@Service()
export default class Logout implements UseCase<string, Promise<void>> {
  constructor(private refreshTokenRepo: RefreshTokenRepo = Container.get(RefreshTokenRepo)) {}

  async execute(sessionId: string): Promise<void> {
    await this.refreshTokenRepo.revoke(sessionId);
  }
}
