import { createHash, randomBytes } from 'node:crypto';
import { SignJWT } from 'jose';
import config from '@/config/index.ts';
import { Container, Service, UnauthorizedError, type UseCase } from '@/shared/index.ts';
import { RefreshToken } from '../../domain/RefreshToken.ts';
import RefreshTokenRepo from '../../repos/RefreshTokenRepo.ts';
import type RefreshDTO from './RefreshDTO.ts';

const jwtKey = new TextEncoder().encode(config.app.jwtSecret);
const sha256 = (v: string) => createHash('sha256').update(v).digest('hex');

export interface RefreshResult {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
  expires_in: number;
}

@Service()
export default class Refresh implements UseCase<RefreshDTO, Promise<RefreshResult>> {
  constructor(private refreshTokenRepo: RefreshTokenRepo = Container.get(RefreshTokenRepo)) {}

  async execute(req: RefreshDTO): Promise<RefreshResult> {
    const hash = sha256(req.refresh_token);
    const userId = await this.refreshTokenRepo.revokeByHash(hash);

    if (!userId) {
      throw new UnauthorizedError('Refresh token is invalid or has already been used');
    }

    const newRefreshTokenPlain = randomBytes(48).toString('base64url');
    const expiresAt = new Date(Date.now() + config.app.refreshTtlDays * 86_400_000);

    const refreshTokenEntity = RefreshToken.create({
      userId,
      tokenHash: sha256(newRefreshTokenPlain),
      expiresAt,
    });

    const savedSession = await this.refreshTokenRepo.save(refreshTokenEntity);

    const accessToken = await new SignJWT({ sid: savedSession.id })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(userId)
      .setIssuedAt()
      .setExpirationTime(`${config.app.jwtAccessTtlSec}s`)
      .sign(jwtKey);

    return {
      access_token: accessToken,
      refresh_token: newRefreshTokenPlain,
      token_type: 'Bearer',
      expires_in: config.app.jwtAccessTtlSec,
    };
  }
}
