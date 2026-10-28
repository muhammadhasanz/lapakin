import { createHash, randomBytes } from 'node:crypto';
import argon2 from 'argon2';
import { SignJWT } from 'jose';
import config from '@/config/index.ts';
import { Container, Service, UnauthorizedError, type UseCase } from '@/shared/index.ts';
import { RefreshToken } from '../../domain/RefreshToken.ts';
import { UserMapper } from '../../mappers/UserMapper.ts';
import RefreshTokenRepo from '../../repos/RefreshTokenRepo.ts';
import UserRepo from '../../repos/UserRepo.ts';
import type LoginDTO from './LoginDTO.ts';

const jwtKey = new TextEncoder().encode(config.app.jwtSecret);
const sha256 = (v: string) => createHash('sha256').update(v).digest('hex');
const DUMMY_HASH = await argon2.hash('dummy-password');

export interface LoginResult {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
  expires_in: number;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

@Service()
export default class Login implements UseCase<LoginDTO, Promise<LoginResult>> {
  constructor(
    private userRepo: UserRepo = Container.get(UserRepo),
    private refreshTokenRepo: RefreshTokenRepo = Container.get(RefreshTokenRepo),
  ) {}

  async execute(req: LoginDTO): Promise<LoginResult> {
    const user = await this.userRepo.findByEmail(req.email);
    const valid = await argon2.verify(user?.password ?? DUMMY_HASH, req.password);

    if (!user || !valid) {
      throw new UnauthorizedError('Incorrect email or password');
    }

    const refreshTokenPlain = randomBytes(48).toString('base64url');
    const expiresAt = new Date(Date.now() + config.app.refreshTtlDays * 86_400_000);

    const refreshTokenEntity = RefreshToken.create({
      userId: user.id,
      tokenHash: sha256(refreshTokenPlain),
      expiresAt,
    });

    const savedSession = await this.refreshTokenRepo.save(refreshTokenEntity);

    const accessToken = await new SignJWT({ sid: savedSession.id })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(user.id)
      .setIssuedAt()
      .setExpirationTime(`${config.app.jwtAccessTtlSec}s`)
      .sign(jwtKey);

    return {
      access_token: accessToken,
      refresh_token: refreshTokenPlain,
      token_type: 'Bearer',
      expires_in: config.app.jwtAccessTtlSec,
      user: UserMapper.toDTO(user),
    };
  }
}
